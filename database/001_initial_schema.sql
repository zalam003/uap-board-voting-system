-- Migration 001: Initial Schema for JWT-based Voting System
-- Created: 2025-06-30
-- Description: Complete schema for UAP Board Voting System

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS encrypted_votes CASCADE;
DROP TABLE IF EXISTS authorized_voters CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS voting_sessions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS otps CASCADE;

-- Voting Sessions Table
CREATE TABLE voting_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    total_invited INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0
);

-- Candidates Table
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voting_session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Authorized Voters Table
CREATE TABLE authorized_voters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voting_session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    jwt_token_hash VARCHAR(255),
    email_sent_at TIMESTAMP WITH TIME ZONE,
    voted_at TIMESTAMP WITH TIME ZONE,
    vote_verification_code VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(voting_session_id, email)
);

-- Encrypted Votes Table (for anonymity)
CREATE TABLE encrypted_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voting_session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    voter_hash VARCHAR(255) NOT NULL, -- Hashed voter identifier for anonymity
    encrypted_choice TEXT, -- Additional encryption layer if needed
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verification_code VARCHAR(255), -- For voter receipt
    ip_address INET,
    user_agent TEXT
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voting_session_id UUID REFERENCES voting_sessions(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    admin_email VARCHAR(255),
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_voting_sessions_status ON voting_sessions(status);
CREATE INDEX idx_voting_sessions_times ON voting_sessions(start_time, end_time);
CREATE INDEX idx_candidates_session ON candidates(voting_session_id);
CREATE INDEX idx_authorized_voters_session ON authorized_voters(voting_session_id);
CREATE INDEX idx_authorized_voters_email ON authorized_voters(email);
CREATE INDEX idx_encrypted_votes_session ON encrypted_votes(voting_session_id);
CREATE INDEX idx_encrypted_votes_candidate ON encrypted_votes(candidate_id);
CREATE INDEX idx_encrypted_votes_timestamp ON encrypted_votes(timestamp);
CREATE INDEX idx_audit_logs_session ON audit_logs(voting_session_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to voting_sessions
CREATE TRIGGER update_voting_sessions_updated_at
    BEFORE UPDATE ON voting_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
