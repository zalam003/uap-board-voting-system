import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '1h'; // 1 hour voting window

export interface JWTPayload {
  email: string;
  votingSessionId: string;
  voterHash: string;
  iat: number;
  exp: number;
  purpose: string;
}

// Generate JWT token for voter
export function generateVoterJWT(email: string, votingSessionId: string): string {
  const voterHash = hashEmail(email);
  
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    email,
    votingSessionId,
    voterHash,
    purpose: 'board-vote'
  };

  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRY,
    issuer: 'uap-voting-system',
    audience: 'uap-voters'
  });
}

// Verify JWT token
export function verifyVoterJWT(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'uap-voting-system',
      audience: 'uap-voters'
    }) as JWTPayload;
    
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Hash email for anonymity
export function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
}

// Hash JWT token for storage
export function hashJWT(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Generate verification code for vote receipt
export function generateVerificationCode(): string {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

// Generate UUID
export function generateUUID(): string {
  return uuidv4();
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Check if voting session is active
export function isVotingActive(startTime?: string, endTime?: string): boolean {
  if (!startTime || !endTime) return false;
  
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  return now >= start && now <= end;
}

// Get client IP from request
export function getClientIP(req: any): string {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
         'unknown';
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
    .substring(0, 1000); // Limit length
}

// Time utilities
export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}
