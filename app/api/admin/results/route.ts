import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/database';

// Verify admin access
function verifyAdmin(request: NextRequest): boolean {
  const adminSecret = request.headers.get('x-admin-secret');
  const expectedSecret = process.env.ADMIN_SECRET;
  
  return adminSecret === expectedSecret && expectedSecret !== undefined;
}

// GET /api/admin/results?sessionId=xxx - Get voting results and tally
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const format = searchParams.get('format'); // 'csv' for download

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
    // Get session details
    const session = await database.get(
      'SELECT * FROM voting_sessions WHERE id = ?',
      [sessionId]
    );

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get vote counts per candidate
    const voteCounts = await database.all(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.position,
        COUNT(ev.id) as vote_count
      FROM candidates c
      LEFT JOIN encrypted_votes ev ON c.id = ev.candidate_id AND ev.voting_session_id = ?
      WHERE c.voting_session_id = ? AND c.is_active = 1
      GROUP BY c.id, c.name, c.description, c.position
      ORDER BY c.position ASC
    `, [sessionId, sessionId]);

    // Calculate total votes
    const totalVotes = voteCounts.reduce((sum, candidate) => sum + candidate.vote_count, 0);

    // Add percentages and determine winner
    const results = voteCounts.map(candidate => ({
      ...candidate,
      percentage: totalVotes > 0 ? ((candidate.vote_count / totalVotes) * 100).toFixed(1) : '0.0'
    }));

    // Find winner (highest vote count)
    const winner = results.reduce((prev, current) => 
      current.vote_count > prev.vote_count ? current : prev
    );

    // Get voter statistics
    const voterStats = await database.get(`
      SELECT 
        COUNT(*) as total_invited,
        COUNT(CASE WHEN email_sent_at IS NOT NULL THEN 1 END) as emails_sent,
        COUNT(CASE WHEN voted_at IS NOT NULL THEN 1 END) as votes_cast
      FROM authorized_voters
      WHERE voting_session_id = ?
    `, [sessionId]);

    const summary = {
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        status: session.status,
        start_time: session.start_time,
        end_time: session.end_time
      },
      statistics: {
        totalInvited: voterStats?.total_invited || 0,
        emailsSent: voterStats?.emails_sent || 0,
        votesCast: voterStats?.votes_cast || 0,
        turnoutPercentage: voterStats?.total_invited > 0 
          ? ((voterStats.votes_cast / voterStats.total_invited) * 100).toFixed(1)
          : '0.0'
      },
      results,
      winner: totalVotes > 0 ? {
        name: winner.name,
        votes: winner.vote_count,
        percentage: winner.percentage,
        margin: winner.vote_count - (results.find(r => r.id !== winner.id && r.vote_count === Math.max(...results.filter(r2 => r2.id !== winner.id).map(r2 => r2.vote_count)))?.vote_count || 0)
      } : null,
      totalVotes
    };

    // Return CSV format for download
    if (format === 'csv') {
      const csvContent = generateResultsCSV(summary);
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${session.title.replace(/[^a-zA-Z0-9]/g, '_')}_results.csv"`
        }
      });
    }

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}

// Generate CSV content for results export
function generateResultsCSV(summary: any): string {
  const lines = [];
  
  // Header information
  lines.push('UAP Board Voting System - Election Results');
  lines.push('');
  lines.push(`Election: ${summary.session.title}`);
  lines.push(`Description: ${summary.session.description || 'N/A'}`);
  lines.push(`Status: ${summary.session.status}`);
  lines.push(`Start Time: ${new Date(summary.session.start_time).toLocaleString()}`);
  lines.push(`End Time: ${new Date(summary.session.end_time).toLocaleString()}`);
  lines.push('');
  
  // Statistics
  lines.push('Voting Statistics');
  lines.push(`Total Invited: ${summary.statistics.totalInvited}`);
  lines.push(`Emails Sent: ${summary.statistics.emailsSent}`);
  lines.push(`Votes Cast: ${summary.statistics.votesCast}`);
  lines.push(`Turnout: ${summary.statistics.turnoutPercentage}%`);
  lines.push('');
  
  // Results header
  lines.push('Candidate Results');
  lines.push('Position,Candidate Name,Votes,Percentage');
  
  // Results data
  summary.results.forEach((candidate: any) => {
    lines.push(`${candidate.position},"${candidate.name}",${candidate.vote_count},${candidate.percentage}%`);
  });
  
  lines.push('');
  
  // Winner information
  if (summary.winner) {
    lines.push('Election Winner');
    lines.push(`Winner: ${summary.winner.name}`);
    lines.push(`Votes: ${summary.winner.votes}`);
    lines.push(`Percentage: ${summary.winner.percentage}%`);
    lines.push(`Margin: ${summary.winner.margin} votes`);
  } else {
    lines.push('No votes cast yet');
  }
  
  lines.push('');
  lines.push(`Report Generated: ${new Date().toLocaleString()}`);
  
  return lines.join('\n');
}
