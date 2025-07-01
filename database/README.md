# Database - UAP Board Voting System

This directory contains database migration scripts for the UAP Board Voting System using **PostgreSQL**.

## Migration Files

- `001_initial_schema.sql` - Complete PostgreSQL schema for JWT-based voting system
- `002_seed_data.sql` - Sample data for testing and demo

## Database Schema Overview

### Core Tables

1. **voting_sessions** - Manages voting sessions/elections
   - Tracks voting periods, status, and metadata
   - Supports multiple concurrent elections

2. **candidates** - Stores candidate information
   - Linked to specific voting sessions
   - Supports candidate descriptions and ordering

3. **authorized_voters** - Pre-approved voter list
   - Stores JWT token hashes for security
   - Tracks email delivery and voting status

4. **encrypted_votes** - Anonymous vote storage
   - Uses voter hashes for anonymity
   - Includes verification codes for receipts

5. **audit_logs** - Complete audit trail
   - Tracks all system actions
   - Includes admin actions and system events

## Prerequisites

### Installing PostgreSQL

#### **Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### **macOS:**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Or using Postgres.app (GUI)
# Download from: https://postgresapp.com/
```

#### **Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Run installer and follow setup wizard
- Remember the password for the `postgres` user

### Setting up the Database

1. **Create Database User**
   ```bash
   # Connect to PostgreSQL as superuser
   sudo -u postgres psql
   
   # Create user and database
   CREATE USER uap_voting WITH PASSWORD 'your_secure_password';
   CREATE DATABASE uap_voting OWNER uap_voting;
   GRANT ALL PRIVILEGES ON DATABASE uap_voting TO uap_voting;
   
   # Exit PostgreSQL
   \q
   ```

2. **Test Connection**
   ```bash
   psql -h localhost -U uap_voting -d uap_voting
   # Enter password when prompted
   ```

## Running Migrations

### Automated Setup (Recommended)

#### Prerequisites
1. **PostgreSQL Server** running locally or remotely
2. **Database created** (or use `--create-db` flag)
3. **Connection string** in `.env.local`

#### Setup Commands
```bash
# 1. Set up environment
cp .env.example .env.local
# Edit .env.local with your PostgreSQL connection string

# 2. Run migrations on existing database
npm run setup-db

# 3. Create database and run migrations (if database doesn't exist)
npm run create-db

# 4. Reset database (re-run migrations)
npm run db:reset
```

#### Connection String Examples
```bash
# Local development
DATABASE_URL=postgresql://uap_voting:password@localhost:5432/uap_voting

# Cloud provider (with SSL)
DATABASE_URL=postgresql://user:pass@host.com:5432/uap_voting?sslmode=require

# Heroku style
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
```

### Manual Setup
```bash
# Connect to your PostgreSQL server
psql -h localhost -U uap_voting -d uap_voting

# Run schema
\i database/001_initial_schema.sql

# Run seed data
\i database/002_seed_data.sql
```

## Environment Configuration

### Required Environment Variables
```bash
# Database connection (required)
DATABASE_URL=postgresql://username:password@localhost:5432/uap_voting

# Optional database settings for advanced configuration
DB_POOL_MAX=20                    # Maximum connections in pool
DB_POOL_IDLE_TIMEOUT=30000       # Idle connection timeout (ms)
DB_POOL_CONNECTION_TIMEOUT=2000   # Connection timeout (ms)
```

### Development vs Production
```bash
# Development
DATABASE_URL=postgresql://postgres:password@localhost:5432/uap_voting_dev

# Production (with SSL)
DATABASE_URL=postgresql://user:pass@prod-host:5432/uap_voting_prod?sslmode=require
```

## Cloud PostgreSQL Options

### **Vercel Postgres (Recommended for Vercel deployment)**
```bash
# Install Vercel CLI
npm i -g vercel

# Create Postgres database
vercel postgres create uap-voting-db

# Get connection string from Vercel dashboard
```

### **Other Cloud Providers**
- **Heroku Postgres**: Heroku add-on with automatic connection string
- **DigitalOcean Managed Database**: Fully managed PostgreSQL
- **AWS RDS**: Amazon's managed PostgreSQL service  
- **Google Cloud SQL**: Google's managed PostgreSQL service
- **Azure Database**: Microsoft's managed PostgreSQL service

## Database Features

### PostgreSQL Advantages
- **Scalability**: Handles large numbers of concurrent voters
- **ACID Compliance**: Ensures data integrity during high-load voting
- **Advanced Features**: JSON support, full-text search, advanced indexing
- **Production Ready**: Enterprise-grade reliability and performance
- **Connection Pooling**: Efficient resource management
- **SSL Support**: Encrypted connections for production deployment

### Security Features
- **JWT Token Hashing**: Tokens are hashed before storage using PostgreSQL crypto functions
- **Vote Anonymization**: Voter identity separated from vote choice
- **Audit Trail**: Complete logging with PostgreSQL JSONB for flexible details
- **Vote Verification**: Each vote gets a verification code
- **IP Tracking**: Security monitoring with PostgreSQL network types
- **Role-Based Access**: PostgreSQL user permissions and roles

## Performance Optimization

### Indexing
The schema includes optimized indexes for:
- Session lookups by status and time
- Candidate lookups by session
- Voter lookups by email and session
- Vote lookups by session and candidate
- Audit log lookups by session and timestamp

### Connection Pooling
The application uses PostgreSQL connection pooling with:
- Maximum 20 connections
- 30-second idle timeout
- 2-second connection timeout
- Automatic connection health monitoring

### Production Recommendations
- Enable query logging for monitoring
- Set up regular VACUUM and ANALYZE
- Monitor connection pool usage
- Configure appropriate work_mem and shared_buffers
- Enable SSL for security
- Set up backup and recovery procedures

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql
   # Start if not running
   sudo systemctl start postgresql
   
   # On macOS
   brew services list | grep postgresql
   brew services start postgresql@15
   ```

2. **Database Does Not Exist**
   ```bash
   # Use the create-db command
   npm run create-db
   
   # Or manually create
   createdb uap_voting
   ```

3. **Authentication Failed**
   ```bash
   # Check username/password in DATABASE_URL
   # Ensure user has proper permissions:
   sudo -u postgres psql -c "ALTER USER uap_voting CREATEDB;"
   ```

4. **SSL Issues in Production**
   ```bash
   # Add SSL parameters to connection string
   DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
   ```

5. **Permission Denied**
   ```bash
   # Grant permissions to user
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE uap_voting TO uap_voting;"
   ```

### Migration Debugging
```bash
# Check database connection
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT version()').then(r => console.log(r.rows[0])).catch(console.error);
"

# Check tables exist
psql $DATABASE_URL -c "\dt"

# Check table contents
psql $DATABASE_URL -c "SELECT * FROM voting_sessions;"

# Check permissions
psql $DATABASE_URL -c "\du"
```

### Admin Panel Diagnostics
The admin panel includes built-in database diagnostics:
- Real-time connection testing
- Schema validation with missing table detection
- Automatic troubleshooting suggestions
- One-click database initialization
- Connection health monitoring

## Backup and Recovery

### Database Backup
```bash
# Full database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Schema only backup
pg_dump --schema-only $DATABASE_URL > schema_backup.sql

# Data only backup
pg_dump --data-only $DATABASE_URL > data_backup.sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Database Restore
```bash
# Restore from backup
psql $DATABASE_URL < backup_file.sql

# Restore to new database
createdb new_database_name
psql new_database_name < backup_file.sql

# Restore compressed backup
gunzip -c backup_file.sql.gz | psql $DATABASE_URL
```

### Automated Backups
```bash
# Add to crontab for daily backups
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/uap_voting_$(date +\%Y\%m\%d).sql.gz
```

## Schema Updates

When making schema changes:

1. **Create Migration File**: Create new numbered migration file (e.g., `003_add_feature.sql`)
2. **Test Locally**: Test migration on development database first
3. **Backup Production**: Always backup production database before applying
4. **Apply Migration**: Run migration using psql or admin panel
5. **Update Documentation**: Update this README with new table descriptions
6. **Update Types**: Update TypeScript interfaces in `lib/database.ts`

### Migration Template
```sql
-- Migration 003: Add new feature
-- Created: YYYY-MM-DD
-- Description: What this migration does

BEGIN;

-- Add new table/column/index
CREATE TABLE IF NOT EXISTS new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- columns here
);

-- Update existing data if needed
-- UPDATE existing_table SET ...

COMMIT;
```

## Support

For database-related issues:
1. Check this documentation
2. Use admin panel database diagnostics
3. Review PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`
4. Test connection with provided debugging commands
5. Verify environment variables and permissions

---

**University of Asia Pacific**  
**Board Voting System Database Documentation**  
**PostgreSQL Production Database**
