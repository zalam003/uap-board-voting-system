#!/usr/bin/env node
// Quick database reset script
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function resetDatabase() {
  console.log('🗄️  Resetting UAP Voting System Database...');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');

    // Drop all tables (in correct order due to foreign keys)
    console.log('🗑️  Dropping existing tables...');
    await pool.query('BEGIN');
    
    const dropSQL = `
      DROP TABLE IF EXISTS encrypted_votes CASCADE;
      DROP TABLE IF EXISTS authorized_voters CASCADE;
      DROP TABLE IF EXISTS candidates CASCADE;
      DROP TABLE IF EXISTS voting_sessions CASCADE;
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS votes CASCADE;
      DROP TABLE IF EXISTS otps CASCADE;
    `;
    
    await pool.query(dropSQL);
    await pool.query('COMMIT');
    console.log('✅ All tables dropped successfully');

    // Recreate schema
    const schemaPath = path.join(__dirname, '..', 'database', '001_initial_schema.sql');
    console.log('📋 Recreating database schema...');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query('BEGIN');
    await pool.query(schema);
    await pool.query('COMMIT');
    console.log('✅ Database schema created successfully');

    // Insert seed data
    const seedPath = path.join(__dirname, '..', 'database', '002_seed_data.sql');
    console.log('🌱 Inserting fresh seed data...');
    const seedData = fs.readFileSync(seedPath, 'utf8');
    
    await pool.query('BEGIN');
    await pool.query(seedData);
    await pool.query('COMMIT');
    console.log('✅ Seed data inserted successfully');

    // Verify reset
    const sessionCount = await pool.query('SELECT COUNT(*) FROM voting_sessions');
    const candidateCount = await pool.query('SELECT COUNT(*) FROM candidates');
    
    console.log(`📊 Database reset verification:`);
    console.log(`   • Voting sessions: ${sessionCount.rows[0].count}`);
    console.log(`   • Candidates: ${candidateCount.rows[0].count}`);
    console.log('🎉 Database reset complete! Fresh seed data loaded.');

  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();
