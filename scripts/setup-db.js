#!/usr/bin/env node
// UAP Voting System database setup and migration runner
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigrations() {
  console.log('🗄️  Setting up UAP Voting System Database...');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Please set DATABASE_URL in your .env.local file:');
    console.log('DATABASE_URL=postgresql://username:password@localhost:5432/uap_voting');
    process.exit(1);
  }

  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    console.error('❌ DATABASE_URL must be a PostgreSQL connection string');
    console.log('Example: DATABASE_URL=postgresql://username:password@localhost:5432/uap_voting');
    process.exit(1);
  }

  console.log(`📍 Connecting to: ${databaseUrl.replace(/\/\/.*@/, '//***:***@')}`);

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

    // Check if tables already exist
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'voting_sessions'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('⚠️  Tables already exist. Skipping schema creation.');
      console.log('To reset the database, drop the tables manually and run this script again.');
    } else {
      // Run schema migration
      const schemaPath = path.join(__dirname, '..', 'database', '001_initial_schema.sql');
      
      if (fs.existsSync(schemaPath)) {
        console.log('📋 Running schema migration...');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute the entire schema as one transaction
        await pool.query('BEGIN');
        try {
          await pool.query(schema);
          await pool.query('COMMIT');
          console.log('✅ Database schema created successfully');
        } catch (error) {
          await pool.query('ROLLBACK');
          throw error;
        }
      } else {
        console.error('❌ Schema file not found:', schemaPath);
        process.exit(1);
      }

      // Run seed data
      const seedPath = path.join(__dirname, '..', 'database', '002_seed_data.sql');
      
      if (fs.existsSync(seedPath)) {
        console.log('🌱 Inserting seed data...');
        const seedData = fs.readFileSync(seedPath, 'utf8');
        
        await pool.query('BEGIN');
        try {
          await pool.query(seedData);
          await pool.query('COMMIT');
          console.log('✅ Seed data inserted successfully');
        } catch (error) {
          await pool.query('ROLLBACK');
          throw error;
        }
      } else {
        console.log('⚠️  Seed data file not found, skipping...');
      }
    }

    // Verify setup
    console.log('🔍 Verifying database setup...');
    const sessionCount = await pool.query('SELECT COUNT(*) FROM voting_sessions');
    const candidateCount = await pool.query('SELECT COUNT(*) FROM candidates');
    
    console.log(`📊 Database verification:`);
    console.log(`   • Voting sessions: ${sessionCount.rows[0].count}`);
    console.log(`   • Candidates: ${candidateCount.rows[0].count}`);

    console.log('🎉 Database setup complete!');
    console.log('🚀 You can now start the application with: npm run dev');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused. Please ensure:');
      console.log('   1. PostgreSQL server is running');
      console.log('   2. Database exists');
      console.log('   3. Username and password are correct');
      console.log('   4. Host and port are accessible');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Host not found. Please check your DATABASE_URL host.');
    } else if (error.code === '28P01') {
      console.log('\n💡 Authentication failed. Please check username and password.');
    } else if (error.code === '3D000') {
      console.log('\n💡 Database does not exist. Please create the database first.');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Database creation helper
async function createDatabase() {
  console.log('🏗️  Creating database...');
  
  const databaseUrl = process.env.DATABASE_URL;
  const url = new URL(databaseUrl);
  const dbName = url.pathname.slice(1); // Remove leading slash
  
  // Connect to postgres database to create our database
  url.pathname = '/postgres';
  
  const pool = new Pool({
    connectionString: url.toString(),
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await pool.query(`CREATE DATABASE "${dbName}"`);
    console.log(`✅ Database "${dbName}" created successfully`);
  } catch (error) {
    if (error.code === '42P04') {
      console.log(`⚠️  Database "${dbName}" already exists`);
    } else {
      throw error;
    }
  } finally {
    await pool.end();
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--create-db')) {
    createDatabase()
      .then(() => runMigrations())
      .catch(console.error);
  } else if (args.includes('--help')) {
    console.log(`
UAP Voting System - Database Setup

Commands:
  node scripts/setup-db.js           Run migrations on existing database
  node scripts/setup-db.js --create-db    Create database and run migrations
  node scripts/setup-db.js --help         Show this help

Environment Variables Required:
  DATABASE_URL=postgresql://username:password@localhost:5432/uap_voting

Examples:
  DATABASE_URL=postgresql://postgres:password@localhost:5432/uap_voting
  DATABASE_URL=postgresql://user:pass@host.com:5432/uap_voting_prod?sslmode=require
    `);
  } else {
    runMigrations().catch(console.error);
  }
}

module.exports = { runMigrations, createDatabase };
