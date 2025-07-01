import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/database';
import { generateUUID, formatTimestamp, getClientIP, isValidEmail, generateVoterJWT, hashJWT } from '@/lib/utils';
import { sendBatchVotingEmails, EmailData } from '@/lib/email';

// Verify admin access
function verifyAdmin(request: NextRequest): boolean {
  const adminSecret = request.headers.get('x-admin-secret');
  const expectedSecret = process.env.ADMIN_SECRET;
  
  return adminSecret === expectedSecret && expectedSecret !== undefined;
}

// POST /api/admin/voters - Upload CSV and send voting emails
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sessionId, emails } = await request.json();

    if (!sessionId || !emails || !Array.isArray(emails)) {
      return NextResponse.json({ 
        error: 'Session ID and emails array are required' 
      }, { status: 400 });
    }

    // Validate session exists and is in draft status
    const session = await database.get(
      'SELECT * FROM voting_sessions WHERE id = ?',
      [sessionId]
    );

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'draft') {
      return NextResponse.json({ 
        error: 'Can only add voters to draft sessions' 
      }, { status: 400 });
    }

    // Get candidates for this session
    const candidates = await database.all(`
      SELECT name FROM candidates 
      WHERE voting_session_id = ? AND is_active = 1
      ORDER BY position ASC
    `, [sessionId]);

    if (candidates.length === 0) {
      return NextResponse.json({ 
        error: 'No candidates found for this session' 
      }, { status: 400 });
    }

    const candidateNames = candidates.map(c => c.name);

    // Validate and process emails
    const validEmails = [];
    const invalidEmails = [];
    const duplicateEmails = [];

    for (const email of emails) {
      const cleanEmail = email.trim().toLowerCase();
      
      if (!isValidEmail(cleanEmail)) {
        invalidEmails.push(cleanEmail);
        continue;
      }

      // Check if already exists in this session
      const existing = await database.get(
        'SELECT id FROM authorized_voters WHERE voting_session_id = ? AND email = ?',
        [sessionId, cleanEmail]
      );

      if (existing) {
        duplicateEmails.push(cleanEmail);
        continue;
      }

      validEmails.push(cleanEmail);
    }

    if (validEmails.length === 0) {
      return NextResponse.json({ 
        error: 'No valid new emails to process',
        details: { invalidEmails, duplicateEmails }
      }, { status: 400 });
    }

    // Generate JWT tokens and store authorized voters
    const emailData: EmailData[] = [];
    const voterInserts = [];

    for (const email of validEmails) {
      const voterId = generateUUID();
      const jwtToken = generateVoterJWT(email, sessionId);
      const tokenHash = hashJWT(jwtToken);
      const now = formatTimestamp();

      voterInserts.push([
        voterId, sessionId, email, tokenHash, now
      ]);

      emailData.push({
        to: email,
        votingToken: jwtToken,
        sessionTitle: session.title,
        candidateNames,
        votingDeadline: session.end_time
      });
    }

    // Insert all voters in batch
    for (const insert of voterInserts) {
      await database.run(`
        INSERT INTO authorized_voters (
          id, voting_session_id, email, jwt_token_hash, created_at
        ) VALUES (?, ?, ?, ?, ?)
      `, insert);
    }

    // Send emails in batches
    const emailResults = await sendBatchVotingEmails(emailData);

    // Update email sent status for successful sends
    const now = formatTimestamp();
    for (let i = 0; i < emailData.length; i++) {
      if (i < emailResults.sent) {  // Assuming emails are sent in order
        await database.run(
          'UPDATE authorized_voters SET email_sent_at = ? WHERE email = ? AND voting_session_id = ?',
          [now, emailData[i].to, sessionId]
        );
      }
    }

    // Update session stats
    await database.run(`
      UPDATE voting_sessions 
      SET total_invited = total_invited + ?, emails_sent = emails_sent + ?
      WHERE id = ?
    `, [validEmails.length, emailResults.sent, sessionId]);

    // Log the action
    await database.run(`
      INSERT INTO audit_logs (
        id, voting_session_id, action, entity_type, entity_id, details, admin_email, ip_address
      ) VALUES (?, ?, 'VOTERS_ADDED', 'voting_session', ?, ?, ?, ?)
    `, [
      generateUUID(),
      sessionId,
      sessionId,
      JSON.stringify({
        totalEmails: emails.length,
        validEmails: validEmails.length,
        invalidEmails: invalidEmails.length,
        duplicateEmails: duplicateEmails.length,
        emailsSent: emailResults.sent,
        emailsFailed: emailResults.failed
      }),
      'admin@uap-bd.edu',
      getClientIP(request)
    ]);

    return NextResponse.json({
      message: 'Voters processed successfully',
      results: {
        totalProcessed: emails.length,
        validEmails: validEmails.length,
        invalidEmails: invalidEmails.length,
        duplicateEmails: duplicateEmails.length,
        emailsSent: emailResults.sent,
        emailsFailed: emailResults.failed,
        errors: emailResults.errors
      },
      invalidEmails,
      duplicateEmails
    });

  } catch (error) {
    console.error('Error processing voters:', error);
    return NextResponse.json({ 
      error: 'Failed to process voters',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/admin/voters?sessionId=xxx - Get voters for a session
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
    const voters = await database.all(`
      SELECT 
        id,
        email,
        email_sent_at,
        voted_at,
        vote_verification_code,
        created_at
      FROM authorized_voters 
      WHERE voting_session_id = ?
      ORDER BY created_at ASC
    `, [sessionId]);

    const summary = {
      total: voters.length,
      emailsSent: voters.filter(v => v.email_sent_at).length,
      voted: voters.filter(v => v.voted_at).length,
      pending: voters.filter(v => v.email_sent_at && !v.voted_at).length
    };

    return NextResponse.json({ voters, summary });
  } catch (error) {
    console.error('Error fetching voters:', error);
    return NextResponse.json({ error: 'Failed to fetch voters' }, { status: 500 });
  }
}
