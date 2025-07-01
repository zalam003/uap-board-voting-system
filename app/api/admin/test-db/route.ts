import { NextRequest, NextResponse } from 'next/server';
import database, { initializeDatabase } from '@/lib/database';
import { generateUUID, formatTimestamp, getClientIP } from '@/lib/utils';

// Verify admin access
function verifyAdmin(request: NextRequest): boolean {
  const adminSecret = request.headers.get('x-admin-secret');
  const expectedSecret = process.env.ADMIN_SECRET;
  
  console.log('DB Test - Admin verification:');
  console.log('- Received secret:', adminSecret);
  console.log('- Expected secret:', expectedSecret);
  console.log('- Secrets match:', adminSecret === expectedSecret);
  console.log('- Expected secret exists:', expectedSecret !== undefined);
  
  return adminSecret === expectedSecret && expectedSecret !== undefined;
}

// GET /api/admin/test-db - Test PostgreSQL database connection
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    // Check environment variable
    if (!databaseUrl) {
      return NextResponse.json({
        error: 'DATABASE_URL not configured',
        details: 'Please set DATABASE_URL environment variable',
        example: 'postgresql://username:password@localhost:5432/uap_voting'
      }, { status: 500 });
    }

    // Validate PostgreSQL URL
    if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      return NextResponse.json({
        error: 'Invalid DATABASE_URL format',
        details: 'DATABASE_URL must be a PostgreSQL connection string',
        example: 'postgresql://username:password@localhost:5432/uap_voting',
        current: databaseUrl.replace(/\/\/.*@/, '//***:***@') // Hide credentials
      }, { status: 500 });
    }

    // Test basic connection
    console.log('Testing PostgreSQL database connection...');
    const connectionTest = await database.testConnection();
    
    if (!connectionTest) {
      return NextResponse.json({
        error: 'Database connection failed',
        details: 'Could not connect to PostgreSQL database',
        suggestions: [
          'Check if PostgreSQL server is running',
          'Verify username and password in DATABASE_URL',
          'Ensure database exists',
          'Check host and port accessibility',
          'Verify SSL settings for production'
        ]
      }, { status: 500 });
    }

    // Test database structure
    console.log('Testing database structure...');
    const tableCheck = await database.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('voting_sessions', 'candidates', 'authorized_voters', 'encrypted_votes', 'audit_logs')
      ORDER BY table_name
    `);

    const expectedTables = ['audit_logs', 'authorized_voters', 'candidates', 'encrypted_votes', 'voting_sessions'];
    const existingTables = tableCheck.rows.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));

    // Get database version and info
    const versionResult = await database.query('SELECT version()');
    const dbVersion = versionResult.rows[0]?.version || 'Unknown';

    // Get connection info
    const connectionInfo = await database.query(`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        inet_server_addr() as server_address,
        inet_server_port() as server_port
    `);

    const connInfo = connectionInfo.rows[0];

    // Count records in main tables (if they exist)
    const tableCounts: any = {};
    for (const table of existingTables) {
      try {
        const countResult = await database.query(`SELECT COUNT(*) as count FROM ${table}`);
        tableCounts[table] = parseInt(countResult.rows[0].count);
      } catch (error) {
        tableCounts[table] = 'Error reading';
      }
    }

    // Log the test
    await database.run(`
      INSERT INTO audit_logs (
        id, action, entity_type, details, admin_email, ip_address
      ) VALUES (?, 'DATABASE_TEST', 'system', ?, ?, ?)
    `, [
      generateUUID(),
      JSON.stringify({ 
        connectionStatus: 'OK',
        tablesFound: existingTables.length,
        missingTables: missingTables.length,
        timestamp: formatTimestamp()
      }),
      'admin@uap-bd.edu',
      getClientIP(request)
    ]);

    return NextResponse.json({
      status: 'success',
      connection: {
        connected: true,
        database: connInfo.database_name,
        user: connInfo.user_name,
        host: connInfo.server_address || 'localhost',
        port: connInfo.server_port || 5432,
        version: dbVersion
      },
      schema: {
        tablesExpected: expectedTables.length,
        tablesFound: existingTables.length,
        existingTables,
        missingTables,
        isComplete: missingTables.length === 0
      },
      data: tableCounts,
      timestamp: formatTimestamp()
    });

  } catch (error) {
    console.error('Database test error:', error);
    
    // Try to log the error (might fail if database is completely down)
    try {
      await database.run(`
        INSERT INTO audit_logs (
          id, action, entity_type, details, admin_email, ip_address
        ) VALUES (?, 'DATABASE_TEST_FAILED', 'system', ?, ?, ?)
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
      console.error('Failed to log database test error:', logError);
    }

    // Provide specific error messages based on error type
    let errorDetails = 'Unknown database error';
    let suggestions: string[] = [];

    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        errorDetails = 'Connection refused - PostgreSQL server not running or not accessible';
        suggestions = [
          'Check if PostgreSQL server is running: sudo systemctl status postgresql',
          'Verify host and port in DATABASE_URL',
          'Check firewall settings'
        ];
      } else if (error.message.includes('ENOTFOUND')) {
        errorDetails = 'Host not found - invalid hostname in DATABASE_URL';
        suggestions = [
          'Check hostname in DATABASE_URL',
          'Verify network connectivity'
        ];
      } else if (error.message.includes('28P01')) {
        errorDetails = 'Authentication failed - invalid username or password';
        suggestions = [
          'Check username and password in DATABASE_URL',
          'Verify user exists in PostgreSQL',
          'Check user permissions'
        ];
      } else if (error.message.includes('3D000')) {
        errorDetails = 'Database does not exist';
        suggestions = [
          'Create the database: npm run create-db',
          'Or manually: createdb your_database_name'
        ];
      } else {
        errorDetails = error.message;
        suggestions = [
          'Check PostgreSQL logs for more details',
          'Verify DATABASE_URL format',
          'Ensure database server is accessible'
        ];
      }
    }

    return NextResponse.json({ 
      error: 'Database test failed',
      details: errorDetails,
      suggestions,
      timestamp: formatTimestamp()
    }, { status: 500 });
  }
}

// POST /api/admin/test-db - Initialize database (run migrations)
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action } = await request.json();

    if (action === 'initialize') {
      console.log('Initializing database...');
      const success = await initializeDatabase();
      
      if (success) {
        // Log the initialization
        await database.run(`
          INSERT INTO audit_logs (
            id, action, entity_type, details, admin_email, ip_address
          ) VALUES (?, 'DATABASE_INITIALIZED', 'system', ?, ?, ?)
        `, [
          generateUUID(),
          JSON.stringify({ 
            success: true,
            timestamp: formatTimestamp()
          }),
          'admin@uap-bd.edu',
          getClientIP(request)
        ]);

        return NextResponse.json({
          message: 'Database initialized successfully',
          timestamp: formatTimestamp()
        });
      } else {
        return NextResponse.json({
          error: 'Database initialization failed',
          details: 'Check server logs for more information'
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({
        error: 'Invalid action',
        availableActions: ['initialize']
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      error: 'Database initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
