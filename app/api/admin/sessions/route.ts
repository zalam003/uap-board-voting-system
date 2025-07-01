import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/database';
import { generateUUID, formatTimestamp, addHours, getClientIP } from '@/lib/utils';

// Verify admin access
function verifyAdmin(request: NextRequest): boolean {
  const adminSecret = request.headers.get('x-admin-secret');
  const expectedSecret = process.env.ADMIN_SECRET;
  
  console.log('Admin verification:');
  console.log('- Received secret:', adminSecret);
  console.log('- Expected secret:', expectedSecret);
  console.log('- Secrets match:', adminSecret === expectedSecret);
  console.log('- Expected secret exists:', expectedSecret !== undefined);
  
  return adminSecret === expectedSecret && expectedSecret !== undefined;
}

// GET /api/admin/sessions - Get all voting sessions
export async function GET(request: NextRequest) {
  console.log('Sessions API called');
  
  if (!verifyAdmin(request)) {
    console.log('Admin verification failed');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Admin verification passed, querying database...');

  try {
    const sessions = await database.all(`
      SELECT 
        vs.*,
        COUNT(c.id) as candidate_count,
        COUNT(av.id) as voter_count,
        COUNT(ev.id) as vote_count
      FROM voting_sessions vs
      LEFT JOIN candidates c ON vs.id = c.voting_session_id AND c.is_active = 1
      LEFT JOIN authorized_voters av ON vs.id = av.voting_session_id
      LEFT JOIN encrypted_votes ev ON vs.id = ev.voting_session_id
      GROUP BY vs.id
      ORDER BY vs.created_at DESC
    `);

    console.log('Database query successful, sessions:', sessions);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST /api/admin/sessions - Create new voting session
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, durationHours = 1 } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const sessionId = generateUUID();
    const now = new Date();
    const startTime = formatTimestamp(now);
    const endTime = formatTimestamp(addHours(now, durationHours));
    
    await database.run(`
      INSERT INTO voting_sessions (
        id, title, description, start_time, end_time, status, created_by
      ) VALUES (?, ?, ?, ?, ?, 'draft', ?)
    `, [sessionId, title, description, startTime, endTime, 'system']);

    // Log the action
    await database.run(`
      INSERT INTO audit_logs (
        id, voting_session_id, action, entity_type, entity_id, details, admin_email, ip_address
      ) VALUES (?, ?, 'SESSION_CREATED', 'voting_session', ?, ?, ?, ?)
    `, [
      generateUUID(),
      sessionId,
      sessionId,
      JSON.stringify({ title, description, durationHours }),
      'admin@uap-bd.edu',
      getClientIP(request)
    ]);

    const session = await database.get(
      'SELECT * FROM voting_sessions WHERE id = ?',
      [sessionId]
    );

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
