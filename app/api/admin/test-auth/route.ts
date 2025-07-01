import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const adminSecret = request.headers.get('x-admin-secret');
  const expectedSecret = process.env.ADMIN_SECRET;
  
  return NextResponse.json({
    receivedSecret: adminSecret || 'null',
    expectedSecret: expectedSecret || 'null',
    secretExists: !!expectedSecret,
    secretsMatch: adminSecret === expectedSecret && expectedSecret !== undefined,
    environment: process.env.NODE_ENV,
    headers: Object.fromEntries(request.headers.entries())
  });
}
