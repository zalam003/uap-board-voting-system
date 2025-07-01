// Health check API endpoint for Docker container monitoring
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      service: 'uap-board-voting-system'
    };

    // Optional: Add database connectivity check
    // You can uncomment and modify this if you want to check database connection
    /*
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      await pool.query('SELECT 1');
      health.database = 'connected';
      pool.end();
    } catch (dbError) {
      health.database = 'disconnected';
      health.status = 'degraded';
    }
    */

    return NextResponse.json(health, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal server error',
        service: 'uap-board-voting-system'
      },
      { status: 503 }
    );
  }
}

// Support for HEAD requests (some health checks prefer HEAD)
export async function HEAD(request: NextRequest) {
  try {
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
