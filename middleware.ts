import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  const securityHeaders = {
    // CORS Configuration
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
      ? 'https://uap-board-voting.vercel.app' // Replace with your actual domain
      : 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-secret, x-voter-token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours

    // Security Headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    
    // HSTS (HTTP Strict Transport Security) - Only in production with HTTPS
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }),

    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  };

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: new Headers(securityHeaders) 
    });
  }

  // HTTPS Enforcement in production
  if (process.env.NODE_ENV === 'production') {
    const url = request.nextUrl.clone();
    
    // Force HTTPS redirect if not already HTTPS
    if (url.protocol !== 'https:' && request.headers.get('x-forwarded-proto') !== 'https') {
      url.protocol = 'https:';
      return NextResponse.redirect(url);
    }
  }

  // Rate limiting headers (basic implementation)
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitHeaders = {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': '99', // This would be dynamic in a real implementation
    'X-RateLimit-Reset': String(Date.now() + 60000), // 1 minute from now
  };

  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Apply to admin routes
    '/admin/:path*',
    // Apply to voting routes  
    '/vote/:path*',
    // Apply to governance routes
    '/governance/:path*',
  ],
};
