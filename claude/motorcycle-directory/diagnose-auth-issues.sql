-- =============================================
-- AUTHENTICATION DIAGNOSTICS
-- =============================================
-- Run these queries in Supabase SQL Editor to diagnose auth issues
-- =============================================

-- =============================================
-- 1. CHECK USERS TABLE STRUCTURE
-- =============================================
-- This shows all columns in the users table
-- EXPECTED: Should NOT have password_hash column after migration
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- =============================================
-- 2. CHECK ROW LEVEL SECURITY POLICIES
-- =============================================
-- This shows all RLS policies on the users table
-- EXPECTED: Should have policies for SELECT, INSERT, and UPDATE
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- =============================================
-- 3. CHECK IF RLS IS ENABLED
-- =============================================
-- EXPECTED: relrowsecurity should be TRUE
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'users';

-- =============================================
-- 4. CHECK TRIGGERS ON AUTH.USERS TABLE
-- =============================================
-- EXPECTED: Should have 'on_auth_user_created' trigger
SELECT
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- =============================================
-- 5. CHECK IF TRIGGER FUNCTION EXISTS
-- =============================================
-- EXPECTED: Should return the handle_new_user function
SELECT
    routine_schema,
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- =============================================
-- 6. COUNT USERS IN AUTH.USERS vs PUBLIC.USERS
-- =============================================
-- This helps identify if profiles are missing for some auth users
SELECT
    'auth.users' AS table_name,
    COUNT(*) AS user_count
FROM auth.users
UNION ALL
SELECT
    'public.users' AS table_name,
    COUNT(*) AS user_count
FROM public.users;

-- =============================================
-- 7. FIND AUTH USERS WITHOUT PROFILES
-- =============================================
-- EXPECTED: Should return empty result set
-- If it returns users, those auth accounts don't have profiles
SELECT
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- =============================================
-- 8. CHECK RECENT USER REGISTRATIONS
-- =============================================
-- Shows the 10 most recent users with their profile status
SELECT
    au.id,
    au.email,
    au.created_at AS auth_created,
    pu.created_at AS profile_created,
    CASE
        WHEN pu.id IS NULL THEN 'MISSING PROFILE'
        ELSE 'HAS PROFILE'
    END AS status,
    pu.first_name,
    pu.last_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 10;

-- =============================================
-- 9. CHECK FOR CONSTRAINT VIOLATIONS
-- =============================================
-- Shows all constraints on the users table
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'users'
ORDER BY tc.constraint_type, tc.constraint_name;

-- =============================================
-- 10. TEST RLS POLICIES (SAFE READ-ONLY TEST)
-- =============================================
-- This tests if you can read from the users table
-- Should work for service_role, might fail for anon role
SELECT
    id,
    email,
    first_name,
    last_name,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- =============================================
-- 11. CHECK FOREIGN KEY CONSTRAINTS
-- =============================================
-- Shows foreign keys that reference the users table
SELECT
    tc.table_schema,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'users';

-- =============================================
-- 12. CHECK SUPABASE AUTH CONFIGURATION
-- =============================================
-- Get auth config settings (requires superuser or service_role)
-- This shows if email confirmation is required
SELECT * FROM auth.config;

-- =============================================
-- NEXT STEPS BASED ON RESULTS:
-- =============================================
--
-- IF password_hash column exists (Query #1):
--   → Run migration-fix-auth-complete.sql
--
-- IF trigger doesn't exist (Query #4 or #5):
--   → Run migration-fix-auth-complete.sql
--
-- IF users exist in auth.users but not public.users (Query #7):
--   → Run the migration, then have those users log in again
--   → OR manually create their profiles
--
-- IF RLS is not enabled (Query #3):
--   → Run: ALTER TABLE users ENABLE ROW LEVEL SECURITY;
--
-- IF no policies exist (Query #2):
--   → Run migration-fix-auth-complete.sql
--
-- =============================================
