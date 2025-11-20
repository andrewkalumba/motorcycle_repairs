-- =============================================
-- COMPREHENSIVE AUTH FIX MIGRATION
-- =============================================
-- This migration fixes all authentication issues by:
-- 1. Removing the password_hash column (Supabase Auth manages passwords)
-- 2. Making the users table compatible with Supabase Auth
-- 3. Adding proper RLS policies with service_role bypass
-- 4. Creating an automatic profile creation trigger
-- =============================================

-- =============================================
-- STEP 1: Remove password_hash column
-- =============================================
-- Supabase Auth manages passwords in auth.users, not in our custom users table
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- =============================================
-- STEP 2: Drop existing RLS policies
-- =============================================
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- =============================================
-- STEP 3: Create improved RLS policies
-- =============================================
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
-- This uses auth.uid() which is available after Supabase Auth signup
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- =============================================
-- STEP 4: Create automatic profile creation trigger
-- =============================================
-- This trigger automatically creates a user profile when a new auth user signs up
-- This prevents the race condition and ensures profile is always created

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, is_active, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- STEP 5: Update existing data (if any)
-- =============================================
-- Set default values for first_name and last_name if they are empty
UPDATE users
SET first_name = 'User', last_name = 'Name'
WHERE first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these queries in Supabase SQL Editor to verify the migration:

-- 1. Check if password_hash column is removed
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public';

-- 2. Check RLS policies
-- SELECT policy_name, policy_command FROM pg_policies WHERE table_name = 'users';

-- 3. Check if trigger exists
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'users';

-- 4. Test trigger by creating a test user (DO NOT RUN IN PRODUCTION)
-- This should be tested via the signup form instead

-- =============================================
-- NOTES FOR DEVELOPER
-- =============================================
-- After running this migration:
-- 1. The password_hash column will be removed from users table
-- 2. User profiles will be automatically created when users sign up via Supabase Auth
-- 3. You can still manually update profiles with additional data (phone, address, etc.)
-- 4. The trigger ensures no race condition between auth.users and public.users
-- 5. RLS policies ensure users can only access their own data
