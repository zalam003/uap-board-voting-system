import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// PostgreSQL connection configuration
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Required for many cloud PostgreSQL providers
  } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create PostgreSQL connection pool
class Database {
  private pool: Pool | null = null;

  private getPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool(connectionConfig);
      
      // Handle pool errors
      this.pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
      });

      console.log('PostgreSQL pool created');
    }
    return this.pool;
  }

  async query<T extends QueryResultRow = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    const pool = this.getPool();
    const start = Date.now();
    
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      console.error('Query:', text);
      console.error('Params:', params);
      throw error;
    }
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID?: number; changes: number }> {
    const result = await this.query(sql, params);
    return { 
      changes: result.rowCount || 0,
      lastID: result.rows[0]?.id // Return ID if INSERT RETURNING was used
    };
  }

  async get<T extends QueryResultRow = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const result = await this.query<T>(sql, params);
    return result.rows[0];
  }

  async all<T extends QueryResultRow = any>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await this.query<T>(sql, params);
    return result.rows;
  }

  async getClient(): Promise<PoolClient> {
    const pool = this.getPool();
    return await pool.connect();
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('PostgreSQL pool closed');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as test');
      return result.rows[0]?.test === 1;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
const database = new Database();

export default database;

// Type definitions for our database models
export interface VotingSession {
  id: string;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  status: 'draft' | 'active' | 'closed';
  created_at: string;
  updated_at: string;
  created_by?: string;
  total_invited: number;
  emails_sent: number;
}

export interface Candidate {
  id: string;
  voting_session_id: string;
  name: string;
  description?: string;
  position: number;
  created_at: string;
  is_active: boolean;
}

export interface AuthorizedVoter {
  id: string;
  voting_session_id: string;
  email: string;
  jwt_token_hash?: string;
  email_sent_at?: string;
  voted_at?: string;
  vote_verification_code?: string;
  created_at: string;
}

export interface EncryptedVote {
  id: string;
  voting_session_id: string;
  candidate_id: string;
  voter_hash: string;
  encrypted_choice?: string;
  timestamp: string;
  verification_code?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditLog {
  id: string;
  voting_session_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: string;
  admin_email?: string;
  ip_address?: string;
  timestamp: string;
}

// Helper functions for common database operations
export async function initializeDatabase(): Promise<boolean> {
  try {
    // Test connection
    const connected = await database.testConnection();
    if (!connected) {
      throw new Error('Failed to connect to PostgreSQL database');
    }

    console.log('✅ PostgreSQL database connection verified');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connections...');
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connections...');
  await database.close();
  process.exit(0);
});
