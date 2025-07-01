-- Migration 002: Seed Data for UAP Board Voting System
-- Created: 2025-06-30
-- Description: Initial seed data for testing and demo

-- Insert sample voting session
INSERT INTO voting_sessions (
    id,
    title, 
    description,
    status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'UAP Board Chairperson Election 2025',
    'Annual election for the Chairperson of the Board of Directors of University of Asia Pacific',
    'draft'
);

-- Insert sample candidates
INSERT INTO candidates (
    id,
    voting_session_id,
    name,
    description,
    position
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Dr. Ahmad Rahman',
    'Former Vice Chancellor with 20+ years of academic leadership experience',
    1
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'Prof. Sarah Ahmed',
    'Distinguished Professor of Business Administration and board member since 2018',
    2
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440001',
    'Mr. Hassan Ali',
    'Successful entrepreneur and philanthropist, UAP alumni',
    3
);

-- Insert audit log for seed data creation
INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    details,
    admin_email
) VALUES (
    'SEED_DATA_CREATED',
    'voting_session',
    '550e8400-e29b-41d4-a716-446655440001',
    '{"candidates_created": 3, "description": "Initial seed data for UAP Board Election 2025"}',
    'system@uap-bd.edu'
);
