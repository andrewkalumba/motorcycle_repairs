-- Migration: Fix Authentication Issues
-- This migration:
-- 1. Adds missing INSERT policy for users table (fixes "Failed to fetch user profile" error)
-- 2. Removes email_verified field (removes email confirmation requirement)

-- =============================================
-- ADD MISSING INSERT POLICY FOR USERS TABLE
-- =============================================
-- This is the critical fix for the "Failed to fetch user profile" error.
-- Without this policy, users cannot insert their profile after registration.

-- Drop the policy if it exists, then create it
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Users can insert own profile"
ON users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- =============================================
-- REMOVE EMAIL VERIFICATION FIELD
-- =============================================
-- Drop the email_verified column from users table
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;

-- =============================================
-- VERIFICATION
-- =============================================
-- Run this to verify the changes:
-- SELECT policy_name, policy_command FROM pg_policies WHERE table_name = 'users';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
