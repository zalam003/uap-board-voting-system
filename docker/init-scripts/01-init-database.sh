#!/bin/bash
# Database initialization script for Docker container
set -e

echo "Starting database initialization..."

# Create the main database if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Ensure the database exists
    SELECT 'CREATE DATABASE uap_voting' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'uap_voting');
    
    -- Create extensions if needed
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOSQL

echo "Running schema initialization..."

# Run the schema file if it exists
if [ -f /opt/database/001_initial_schema.sql ]; then
    echo "Executing initial schema..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /opt/database/001_initial_schema.sql
else
    echo "Warning: Initial schema file not found at /opt/database/001_initial_schema.sql"
fi

# Run the seed data file if it exists
if [ -f /opt/database/002_seed_data.sql ]; then
    echo "Executing seed data..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /opt/database/002_seed_data.sql
else
    echo "Warning: Seed data file not found at /opt/database/002_seed_data.sql"
fi

echo "Database initialization completed!"
