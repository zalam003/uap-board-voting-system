import { NextRequest, NextResponse } from 'next/server';
import { testEmailConnection, sendTestEmail } from '@/lib/email';
import { generateUUID, formatTimestamp, getClientIP } from '@/lib/utils';
import database from '@/lib/database';

// Verify admin access
function verifyAdmin(request: NextRequest): boolean {
  const adminSecret = request.headers.get('x-admin-secret');
  const expectedSecret = process.env.ADMIN_SECRET;
  
  return adminSecret === expectedSecret && expectedSecret !== undefined;
}

// POST /api/admin/test-email - Test Gmail SMTP configuration
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Test connection first
    console.log('Testing Gmail SMTP connection...');
    const connectionTest = await testEmailConnection();
    
    if (!connectionTest) {
      return NextResponse.json({ 
        error: 'Gmail SMTP connection failed',
        details: 'Please check your GMAIL_USER and GMAIL_APP_PASSWORD environment variables'
      }, { status: 500 });
    }

    // Send test email
    console.log(`Sending test email to: ${email}`);
    const emailSent = await sendTestEmail(email);

    if (!emailSent) {
      return NextResponse.json({ 
        error: 'Failed to send test email',
        details: 'SMTP connection successful but email sending failed'
      }, { status: 500 });
    }

    // Log the test email action
    await database.run(`
      INSERT INTO audit_logs (
        id, action, entity_type, details, admin_email, ip_address
      ) VALUES (?, 'TEST_EMAIL_SENT', 'email', ?, ?, ?)
    `, [
      generateUUID(),
      JSON.stringify({ 
        testEmail: email,
        timestamp: formatTimestamp(),
        success: true
      }),
      'admin@uap-bd.edu',
      getClientIP(request)
    ]);

    return NextResponse.json({
      message: 'Test email sent successfully',
      details: {
        connectionStatus: 'OK',
        emailSent: true,
        recipient: email,
        timestamp: formatTimestamp()
      }
    });

  } catch (error) {
    console.error('Error testing email:', error);
    
    // Log the failed test
    try {
      await database.run(`
        INSERT INTO audit_logs (
          id, action, entity_type, details, admin_email, ip_address
        ) VALUES (?, 'TEST_EMAIL_FAILED', 'email', ?, ?, ?)
      `, [
        generateUUID(),
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: formatTimestamp()
        }),
        'admin@uap-bd.edu',
        getClientIP(request)
      ]);
    } catch (logError) {
      console.error('Failed to log email test error:', logError);
    }

    return NextResponse.json({ 
      error: 'Email test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/admin/test-email - Check Gmail SMTP configuration status
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check environment variables
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const fromEmail = process.env.FROM_EMAIL;

    const configStatus = {
      gmailUser: gmailUser ? '✅ Set' : '❌ Missing',
      gmailAppPassword: gmailAppPassword ? '✅ Set' : '❌ Missing',
      fromEmail: fromEmail ? '✅ Set' : '❌ Missing',
      isConfigured: !!(gmailUser && gmailAppPassword)
    };

    if (!configStatus.isConfigured) {
      return NextResponse.json({
        configured: false,
        status: configStatus,
        message: 'Gmail SMTP not properly configured',
        instructions: {
          step1: 'Set GMAIL_USER environment variable to your Gmail address',
          step2: 'Enable 2-Factor Authentication on your Gmail account',
          step3: 'Generate an App Password for Gmail',
          step4: 'Set GMAIL_APP_PASSWORD environment variable to the app password',
          step5: 'Set FROM_EMAIL environment variable (usually same as GMAIL_USER)'
        }
      });
    }

    // Test connection
    const connectionTest = await testEmailConnection();

    return NextResponse.json({
      configured: true,
      connectionWorking: connectionTest,
      status: configStatus,
      message: connectionTest 
        ? 'Gmail SMTP configuration is working correctly'
        : 'Gmail SMTP configured but connection test failed',
      gmailUser: gmailUser,
      fromEmail: fromEmail || gmailUser
    });

  } catch (error) {
    console.error('Error checking email configuration:', error);
    return NextResponse.json({ 
      error: 'Failed to check email configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
