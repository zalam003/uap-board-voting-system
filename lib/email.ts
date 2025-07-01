import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Gmail SMTP Configuration
const createTransporter = (): Transporter => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  
  if (!gmailUser || !gmailAppPassword) {
    console.error('Gmail SMTP credentials not configured');
    throw new Error('Gmail SMTP credentials missing. Please set GMAIL_USER and GMAIL_APP_PASSWORD in environment variables.');
  }

  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
    secure: true, // Use TLS
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates for development
    }
  });
};

export interface EmailData {
  to: string;
  votingToken: string;
  sessionTitle: string;
  candidateNames: string[];
  votingDeadline: string;
}

// Send voting email with JWT token
export async function sendVotingEmail(emailData: EmailData): Promise<boolean> {
  const { to, votingToken, sessionTitle, candidateNames, votingDeadline } = emailData;
  
  const fromEmail = process.env.GMAIL_USER || process.env.FROM_EMAIL || 'noreply@uap-bd.edu';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const votingUrl = `${frontendUrl}/vote?token=${votingToken}`;
  
  const candidateList = candidateNames.map(name => `<li style="margin: 5px 0;">${name}</li>`).join('');
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>UAP Board Voting - ${sessionTitle}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f4f4f4;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header { 
          background-color: #7a0026; 
          color: white; 
          padding: 20px; 
          text-align: center; 
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .header h2 {
          margin: 5px 0 0 0;
          font-size: 18px;
          font-weight: normal;
        }
        .content { 
          padding: 30px; 
          background-color: #f9f9f9; 
        }
        .vote-button { 
          display: inline-block; 
          background-color: #7a0026; 
          color: white !important; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 5px; 
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .candidates { 
          background-color: white; 
          padding: 20px; 
          border-radius: 5px; 
          margin: 15px 0; 
          border-left: 4px solid #7a0026;
        }
        .candidates h4 {
          margin-top: 0;
          color: #7a0026;
        }
        .candidates ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .warning { 
          background-color: #fff3cd; 
          border: 1px solid #ffeaa7; 
          padding: 15px; 
          border-radius: 5px; 
          margin: 15px 0; 
          border-left: 4px solid #f39c12;
        }
        .warning strong {
          color: #8a6d3b;
        }
        .security-notice {
          background-color: #e8f4fd;
          border: 1px solid #bee5eb;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        .security-notice h4 {
          margin-top: 0;
          color: #0c5460;
        }
        .security-notice ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .footer { 
          font-size: 12px; 
          color: #666; 
          text-align: center; 
          padding: 20px;
          background-color: #f8f9fa;
        }
        .button-container {
          text-align: center;
          margin: 25px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>University of Asia Pacific</h1>
          <h2>Board Voting System</h2>
        </div>
        
        <div class="content">
          <h3 style="color: #7a0026; margin-top: 0;">${sessionTitle}</h3>
          
          <p>Dear Board Member,</p>
          
          <p>You are invited to participate in the <strong>${sessionTitle}</strong>. Please review the candidates below and cast your vote.</p>
          
          <div class="candidates">
            <h4>Candidates for Board Chairperson:</h4>
            <ul>
              ${candidateList}
            </ul>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> You have until <strong>${new Date(votingDeadline).toLocaleString()}</strong> to cast your vote. This link will expire after the deadline.
          </div>
          
          <div class="button-container">
            <a href="${votingUrl}" class="vote-button">CAST YOUR VOTE</a>
          </div>
          
          <div class="security-notice">
            <h4>🔒 Security Notice:</h4>
            <ul>
              <li>This voting link is unique to you and should not be shared</li>
              <li>You can only vote once per election</li>
              <li>Your vote is anonymous and secure</li>
              <li>You will receive a confirmation after voting</li>
            </ul>
          </div>
          
          <p>If you have any questions or technical issues, please contact the election administrator.</p>
          
          <p>Thank you for participating in the democratic process of our institution.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>UAP Board Election Committee</strong>
          </p>
        </div>
        
        <div class="footer">
          <p><strong>University of Asia Pacific</strong><br>
          This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    UAP Board Voting: ${sessionTitle}
    
    Dear Board Member,
    
    You are invited to participate in the ${sessionTitle}.
    
    Candidates:
    ${candidateNames.map(name => `• ${name}`).join('\n')}
    
    Vote here: ${votingUrl}
    
    Voting deadline: ${new Date(votingDeadline).toLocaleString()}
    
    This link is unique to you and will expire after the deadline.
    
    University of Asia Pacific
    Board Election Committee
  `;

  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"UAP Board Elections" <${fromEmail}>`,
      to,
      subject: `UAP Board Voting: ${sessionTitle}`,
      html: htmlContent,
      text: textContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Voting email sent to: ${to} (Message ID: ${result.messageId})`);
    return true;
  } catch (error) {
    console.error('Error sending voting email:', error);
    return false;
  }
}

// Send batch voting emails
export async function sendBatchVotingEmails(
  emailDataList: EmailData[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = { sent: 0, failed: 0, errors: [] as string[] };
  
  // Send emails in batches to avoid overwhelming Gmail SMTP
  const batchSize = 5; // Reduced batch size for Gmail SMTP
  const delayBetweenBatches = 2000; // 2 seconds delay
  
  for (let i = 0; i < emailDataList.length; i += batchSize) {
    const batch = emailDataList.slice(i, i + batchSize);
    
    const promises = batch.map(async (emailData) => {
      try {
        const success = await sendVotingEmail(emailData);
        if (success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`Failed to send to ${emailData.to}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Error sending to ${emailData.to}: ${error}`);
      }
    });
    
    await Promise.all(promises);
    
    // Add delay between batches to respect Gmail rate limits
    if (i + batchSize < emailDataList.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  return results;
}

// Send vote confirmation email
export async function sendVoteConfirmation(
  email: string, 
  candidateName: string, 
  verificationCode: string,
  sessionTitle: string
): Promise<boolean> {
  const fromEmail = process.env.GMAIL_USER || process.env.FROM_EMAIL || 'noreply@uap-bd.edu';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Vote Confirmation - ${sessionTitle}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f4f4f4;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header { 
          background-color: #7a0026; 
          color: white; 
          padding: 20px; 
          text-align: center; 
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content { 
          padding: 30px; 
          background-color: #f9f9f9; 
        }
        .confirmation { 
          background-color: #d4edda; 
          border: 1px solid #c3e6cb; 
          padding: 20px; 
          border-radius: 5px; 
          margin: 20px 0; 
          text-align: center;
          border-left: 4px solid #28a745;
        }
        .confirmation h4 {
          margin-top: 0;
          color: #155724;
          font-size: 18px;
        }
        .verification { 
          background-color: #fff; 
          border: 2px solid #7a0026; 
          padding: 20px; 
          text-align: center; 
          border-radius: 5px; 
          margin: 20px 0; 
        }
        .verification h4 {
          margin-top: 0;
          color: #7a0026;
        }
        .verification-code {
          font-family: 'Courier New', monospace;
          font-size: 24px;
          color: #7a0026;
          font-weight: bold;
          letter-spacing: 2px;
          margin: 15px 0;
        }
        .details {
          background-color: #e8f4fd;
          border: 1px solid #bee5eb;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        .details h4 {
          margin-top: 0;
          color: #0c5460;
        }
        .details ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .footer { 
          font-size: 12px; 
          color: #666; 
          text-align: center; 
          padding: 20px;
          background-color: #f8f9fa;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Vote Confirmation</h1>
        </div>
        
        <div class="content">
          <h3 style="color: #7a0026; margin-top: 0;">${sessionTitle}</h3>
          
          <div class="confirmation">
            <h4>✅ Your vote has been recorded successfully!</h4>
            <p>Thank you for participating in the ${sessionTitle}.</p>
          </div>
          
          <div class="verification">
            <h4>Your Vote Verification Code:</h4>
            <div class="verification-code">${verificationCode}</div>
            <p style="margin: 5px 0; font-size: 14px; color: #666;">
              <small>Keep this code for your records</small>
            </p>
          </div>
          
          <div class="details">
            <h4>Vote Details:</h4>
            <ul>
              <li><strong>Session:</strong> ${sessionTitle}</li>
              <li><strong>Vote recorded:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>Verification:</strong> ${verificationCode}</li>
            </ul>
          </div>
          
          <p><strong>Important:</strong> Your vote is anonymous and secure. This confirmation does not reveal your choice.</p>
          
          <p>Results will be announced after the voting period closes.</p>
          
          <p>Thank you for your participation.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>UAP Board Election Committee</strong>
          </p>
        </div>
        
        <div class="footer">
          <p><strong>University of Asia Pacific</strong><br>
          This is an automated confirmation. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Vote Confirmation - ${sessionTitle}
    
    Your vote has been recorded successfully!
    
    Verification Code: ${verificationCode}
    Vote recorded: ${new Date().toLocaleString()}
    
    Thank you for participating.
    
    University of Asia Pacific
    Board Election Committee
  `;

  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"UAP Board Elections" <${fromEmail}>`,
      to: email,
      subject: `Vote Confirmation - ${sessionTitle}`,
      html: htmlContent,
      text: textContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Vote confirmation sent to: ${email} (Message ID: ${result.messageId})`);
    return true;
  } catch (error) {
    console.error('Error sending vote confirmation:', error);
    return false;
  }
}

// Test email connection
export async function testEmailConnection(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Gmail SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('Gmail SMTP connection failed:', error);
    return false;
  }
}

// Send test email
export async function sendTestEmail(to: string): Promise<boolean> {
  const fromEmail = process.env.GMAIL_USER || process.env.FROM_EMAIL || 'noreply@uap-bd.edu';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>UAP Voting System - Test Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #7a0026; color: white; padding: 20px; text-align: center; border-radius: 5px; }
        .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>UAP Voting System</h1>
          <h2>Email Test</h2>
        </div>
        <div class="content">
          <h3>Email Configuration Test Successful! ✅</h3>
          <p>This is a test email to verify that the Gmail SMTP configuration is working correctly.</p>
          <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          <p>If you receive this email, your UAP Board Voting System email configuration is properly set up.</p>
          <p>Best regards,<br>UAP Voting System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"UAP Board Elections" <${fromEmail}>`,
      to,
      subject: 'UAP Voting System - Email Test',
      html: htmlContent,
      text: `UAP Voting System Email Test\n\nThis is a test email to verify Gmail SMTP configuration.\nTest Time: ${new Date().toLocaleString()}\n\nUAP Voting System`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Test email sent to: ${to} (Message ID: ${result.messageId})`);
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    return false;
  }
}
