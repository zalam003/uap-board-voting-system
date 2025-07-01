import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/database';
import { verifyVoterJWT, generateUUID, formatTimestamp, getClientIP, generateVerificationCode, hashEmail } from '@/lib/utils';
import { sendVoteConfirmation } from '@/lib/email';

// GET /api/vote?token=xxx - Get voting session and candidates info
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Voting token is required' }, { status: 400 });
  }

  try {
    // Verify JWT token
    const payload = verifyVoterJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired voting token' }, { status: 401 });
    }

    // Get session details
    const session = await database.get(
      'SELECT * FROM voting_sessions WHERE id = ?',
      [payload.votingSessionId]
    );

    if (!session) {
      return NextResponse.json({ error: 'Voting session not found' }, { status: 404 });
    }

    // Check if session is active
    const now = new Date();
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);

    if (session.status !== 'active' || now < startTime || now > endTime) {
      return NextResponse.json({ 
        error: 'Voting session is not currently active',
        sessionStatus: session.status,
        votingPeriod: {
          start: session.start_time,
          end: session.end_time,
          current: now.toISOString()
        }
      }, { status: 403 });
    }

    // Check if user has already voted
    const existingVote = await database.get(
      'SELECT id FROM authorized_voters WHERE voting_session_id = ? AND email = ? AND voted_at IS NOT NULL',
      [payload.votingSessionId, payload.email]
    );

    if (existingVote) {
      return NextResponse.json({ error: 'You have already voted in this election' }, { status: 409 });
    }

    // Get candidates
    const candidates = await database.all(`
      SELECT id, name, description, position
      FROM candidates 
      WHERE voting_session_id = ? AND is_active = 1
      ORDER BY position ASC
    `, [payload.votingSessionId]);

    if (candidates.length === 0) {
      return NextResponse.json({ error: 'No candidates available for this election' }, { status: 400 });
    }

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        endTime: session.end_time
      },
      candidates,
      voter: {
        email: payload.email
      }
    });

  } catch (error) {
    console.error('Error fetching voting info:', error);
    return NextResponse.json({ error: 'Failed to fetch voting information' }, { status: 500 });
  }
}

// POST /api/vote - Submit vote
export async function POST(request: NextRequest) {
  try {
    const { token, candidateId } = await request.json();

    if (!token || !candidateId) {
      return NextResponse.json({ 
        error: 'Voting token and candidate selection are required' 
      }, { status: 400 });
    }

    // Verify JWT token
    const payload = verifyVoterJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired voting token' }, { status: 401 });
    }

    // Get session details
    const session = await database.get(
      'SELECT * FROM voting_sessions WHERE id = ?',
      [payload.votingSessionId]
    );

    if (!session) {
      return NextResponse.json({ error: 'Voting session not found' }, { status: 404 });
    }

    // Check if session is active and within time window
    const now = new Date();
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);

    if (session.status !== 'active' || now < startTime || now > endTime) {
      return NextResponse.json({ 
        error: 'Voting session is not currently active or has expired' 
      }, { status: 403 });
    }

    // Verify candidate exists and is active
    const candidate = await database.get(`
      SELECT id, name FROM candidates 
      WHERE id = ? AND voting_session_id = ? AND is_active = 1
    `, [candidateId, payload.votingSessionId]);

    if (!candidate) {
      return NextResponse.json({ error: 'Invalid candidate selection' }, { status: 400 });
    }

    // Check if user has already voted (double-check)
    const voter = await database.get(
      'SELECT id, voted_at FROM authorized_voters WHERE voting_session_id = ? AND email = ?',
      [payload.votingSessionId, payload.email]
    );

    if (!voter) {
      return NextResponse.json({ error: 'You are not authorized to vote in this election' }, { status: 403 });
    }

    if (voter.voted_at) {
      return NextResponse.json({ error: 'You have already voted in this election' }, { status: 409 });
    }

    // Generate verification code and voter hash
    const verificationCode = generateVerificationCode();
    const voterHash = hashEmail(payload.email);
    const voteId = generateUUID();
    const timestamp = formatTimestamp(now);
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Record the vote (anonymized)
    await database.run(`
      INSERT INTO encrypted_votes (
        id, voting_session_id, candidate_id, voter_hash, timestamp, 
        verification_code, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      voteId, payload.votingSessionId, candidateId, voterHash, 
      timestamp, verificationCode, clientIP, userAgent
    ]);

    // Update voter record to mark as voted
    await database.run(`
      UPDATE authorized_voters 
      SET voted_at = ?, vote_verification_code = ?
      WHERE id = ?
    `, [timestamp, verificationCode, voter.id]);

    // Log the voting action (without revealing the choice)
    await database.run(`
      INSERT INTO audit_logs (
        id, voting_session_id, action, entity_type, entity_id, 
        details, admin_email, ip_address
      ) VALUES (?, ?, 'VOTE_CAST', 'vote', ?, ?, ?, ?)
    `, [
      generateUUID(),
      payload.votingSessionId,
      voteId,
      JSON.stringify({ 
        voterHash, 
        verificationCode,
        timestamp 
      }),
      payload.email,
      clientIP
    ]);

    // Send confirmation email (without revealing vote choice)
    try {
      await sendVoteConfirmation(
        payload.email,
        candidate.name,
        verificationCode,
        session.title
      );
    } catch (emailError) {
      console.error('Failed to send vote confirmation email:', emailError);
      // Don't fail the vote if email fails
    }

    return NextResponse.json({
      message: 'Your vote has been recorded successfully',
      verificationCode,
      timestamp,
      session: {
        title: session.title,
        endTime: session.end_time
      }
    });

  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json({ 
      error: 'Failed to record vote',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
