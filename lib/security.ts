import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface SecurityConfig {
  requireAuth?: boolean;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  allowedMethods?: string[];
  requireHTTPS?: boolean;
}

export class APISecurityError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'APISecurityError';
  }
}

export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Method validation
      if (config.allowedMethods && !config.allowedMethods.includes(request.method)) {
        return NextResponse.json(
          { error: `Method ${request.method} not allowed` },
          { status: 405 }
        );
      }

      // HTTPS enforcement in production
      if (config.requireHTTPS && process.env.NODE_ENV === 'production') {
        const proto = request.headers.get('x-forwarded-proto');
        if (proto !== 'https') {
          return NextResponse.json(
            { error: 'HTTPS required' },
            { status: 426 } // Upgrade Required
          );
        }
      }

      // Rate limiting
      if (config.rateLimit) {
        const ip = getClientIP(request);
        const key = `rate_limit:${ip}:${request.nextUrl.pathname}`;
        const now = Date.now();
        const limit = rateLimitMap.get(key);

        if (limit) {
          if (now < limit.resetTime) {
            if (limit.count >= config.rateLimit.requests) {
              return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { 
                  status: 429,
                  headers: {
                    'Retry-After': String(Math.ceil((limit.resetTime - now) / 1000)),
                    'X-RateLimit-Limit': String(config.rateLimit.requests),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(limit.resetTime),
                  }
                }
              );
            }
            limit.count++;
          } else {
            // Reset window
            rateLimitMap.set(key, { count: 1, resetTime: now + config.rateLimit.windowMs });
          }
        } else {
          rateLimitMap.set(key, { count: 1, resetTime: now + config.rateLimit.windowMs });
        }
      }

      // Execute the handler
      const response = await handler(request);

      // Add security headers to response
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');

      // Add rate limit headers if configured
      if (config.rateLimit) {
        const ip = getClientIP(request);
        const key = `rate_limit:${ip}:${request.nextUrl.pathname}`;
        const limit = rateLimitMap.get(key);
        
        if (limit) {
          response.headers.set('X-RateLimit-Limit', String(config.rateLimit.requests));
          response.headers.set('X-RateLimit-Remaining', String(Math.max(0, config.rateLimit.requests - limit.count)));
          response.headers.set('X-RateLimit-Reset', String(limit.resetTime));
        }
      }

      return response;
    } catch (error) {
      console.error('API Security Error:', error);
      
      if (error instanceof APISecurityError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

export function verifyAdminSafe(request: NextRequest): boolean {
  const adminSecret = request.headers.get('x-admin-secret');
  const expectedSecret = process.env.ADMIN_SECRET;
  
  // Prevent timing attacks
  if (!expectedSecret || !adminSecret) {
    return false;
  }
  
  // Use constant-time comparison
  return constantTimeCompare(adminSecret, expectedSecret);
}

// Constant-time string comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

export function getClientIP(request: NextRequest): string {
  // Try to get real IP address through various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP.trim();
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }
  
  return request.ip || 'unknown';
}

export function sanitizeInput(input: any): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Basic XSS prevention
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5322 limit
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
