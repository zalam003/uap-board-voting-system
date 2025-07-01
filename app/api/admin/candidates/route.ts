import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/database';
import { generateUUID, formatTimestamp, getClientIP } from '@/lib/utils';

// Verify admin access
function verifyAdmin(request: NextRequest): boolean {
  const adminSecret = request.headers.get('x-admin-secret');
  const expectedSecret = process.env.ADMIN_SECRET;
  
  return adminSecret === expectedSecret && expectedSecret !== undefined;
}

// GET /api/admin/candidates?sessionId=xxx - Get candidates for a session
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
    const candidates = await database.all(`
      SELECT * FROM candidates 
      WHERE voting_session_id = ? AND is_active = 1
      ORDER BY position ASC, name ASC
    `, [sessionId]);

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}

// POST /api/admin/candidates - Add new candidate
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sessionId, name, description, position } = await request.json();

    if (!sessionId || !name) {
      return NextResponse.json({ error: 'Session ID and name are required' }, { status: 400 });
    }

    // Check if session exists and is not active
    const session = await database.get(
      'SELECT status FROM voting_sessions WHERE id = ?',
      [sessionId]
    );

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'active') {
      return NextResponse.json({ error: 'Cannot modify candidates of active session' }, { status: 400 });
    }

    const candidateId = generateUUID();
    
    // If no position provided, get the next position
    let candidatePosition = position;
    if (!candidatePosition) {
      const maxPosition = await database.get(`
        SELECT MAX(position) as max_pos FROM candidates 
        WHERE voting_session_id = ? AND is_active = 1
      `, [sessionId]);
      candidatePosition = (maxPosition?.max_pos || 0) + 1;
    }

    await database.run(`
      INSERT INTO candidates (
        id, voting_session_id, name, description, position
      ) VALUES (?, ?, ?, ?, ?)
    `, [candidateId, sessionId, name, description || '', candidatePosition]);

    // Log the action
    await database.run(`
      INSERT INTO audit_logs (
        id, voting_session_id, action, entity_type, entity_id, details, admin_email, ip_address
      ) VALUES (?, ?, 'CANDIDATE_ADDED', 'candidate', ?, ?, ?, ?)
    `, [
      generateUUID(),
      sessionId,
      candidateId,
      JSON.stringify({ name, description, position: candidatePosition }),
      'admin@uap-bd.edu',
      getClientIP(request)
    ]);

    const candidate = await database.get(
      'SELECT * FROM candidates WHERE id = ?',
      [candidateId]
    );

    return NextResponse.json({ candidate });
  } catch (error) {
    console.error('Error adding candidate:', error);
    return NextResponse.json({ error: 'Failed to add candidate' }, { status: 500 });
  }
}

// PUT /api/admin/candidates - Update candidate
export async function PUT(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, name, description, position } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    // Check if candidate's session is not active
    const candidate = await database.get(`
      SELECT c.*, vs.status as session_status 
      FROM candidates c
      JOIN voting_sessions vs ON c.voting_session_id = vs.id
      WHERE c.id = ?
    `, [id]);

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    if (candidate.session_status === 'active') {
      return NextResponse.json({ error: 'Cannot modify candidates of active session' }, { status: 400 });
    }

    // Build dynamic update query
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (position !== undefined) {
      updates.push('position = ?');
      params.push(position);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    params.push(id);

    await database.run(`
      UPDATE candidates 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    // Log the action
    await database.run(`
      INSERT INTO audit_logs (
        id, voting_session_id, action, entity_type, entity_id, details, admin_email, ip_address
      ) VALUES (?, ?, 'CANDIDATE_UPDATED', 'candidate', ?, ?, ?, ?)
    `, [
      generateUUID(),
      candidate.voting_session_id,
      id,
      JSON.stringify({ name, description, position }),
      'admin@uap-bd.edu',
      getClientIP(request)
    ]);

    const updatedCandidate = await database.get(
      'SELECT * FROM candidates WHERE id = ?',
      [id]
    );

    return NextResponse.json({ candidate: updatedCandidate });
  } catch (error) {
    console.error('Error updating candidate:', error);
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
  }
}

// DELETE /api/admin/candidates - Remove candidate
export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const candidateId = searchParams.get('id');

  if (!candidateId) {
    return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
  }

  try {
    // Check if candidate's session is not active
    const candidate = await database.get(`
      SELECT c.*, vs.status as session_status 
      FROM candidates c
      JOIN voting_sessions vs ON c.voting_session_id = vs.id
      WHERE c.id = ?
    `, [candidateId]);

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    if (candidate.session_status === 'active') {
      return NextResponse.json({ error: 'Cannot remove candidates from active session' }, { status: 400 });
    }

    // Soft delete by setting is_active to false
    await database.run(
      'UPDATE candidates SET is_active = 0 WHERE id = ?',
      [candidateId]
    );

    // Log the action
    await database.run(`
      INSERT INTO audit_logs (
        id, voting_session_id, action, entity_type, entity_id, details, admin_email, ip_address
      ) VALUES (?, ?, 'CANDIDATE_REMOVED', 'candidate', ?, ?, ?, ?)
    `, [
      generateUUID(),
      candidate.voting_session_id,
      candidateId,
      JSON.stringify({ name: candidate.name }),
      'admin@uap-bd.edu',
      getClientIP(request)
    ]);

    return NextResponse.json({ message: 'Candidate removed successfully' });
  } catch (error) {
    console.error('Error removing candidate:', error);
    return NextResponse.json({ error: 'Failed to remove candidate' }, { status: 500 });
  }
}
