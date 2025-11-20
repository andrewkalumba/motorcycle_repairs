-- =============================================
-- COMPREHENSIVE AUTH DIAGNOSTICS
-- =============================================
-- Run this in Supabase SQL Editor to diagnose auth issues

-- =============================================
-- 1. CHECK IF TRIGGER FUNCTION EXISTS
-- =============================================
SELECT
    'Trigger Function Status' as check_type,
    proname as function_name,
    prosecdef as is_security_definer,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- =============================================
-- 2. CHECK IF TRIGGER IS ATTACHED TO auth.users
-- =============================================
SELECT
    'Trigger Status' as check_type,
    trigger_name,
    event_object_schema,
    event_object_table,
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- =============================================
-- 3. CHECK RLS POLICIES ON users TABLE
-- =============================================
SELECT
    'RLS Policies' as check_type,
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
-- 4. CHECK IF RLS IS ENABLED ON users TABLE
-- =============================================
SELECT
    'RLS Enabled Status' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'users' AND schemaname = 'public';

-- =============================================
-- 5. CHECK FOR ORPHANED AUTH USERS
-- =============================================
-- Users in auth.users but NOT in public.users
SELECT
    'Orphaned Auth Users' as check_type,
    au.id,
    au.email,
    au.created_at,
    au.confirmed_at,
    au.raw_user_meta_data
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- =============================================
-- 6. CHECK FOR ORPHANED PUBLIC USERS
-- =============================================
-- Users in public.users but NOT in auth.users (shouldn't happen)
SELECT
    'Orphaned Public Users' as check_type,
    pu.id,
    pu.email,
    pu.created_at
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL;

-- =============================================
-- 7. CHECK USERS TABLE SCHEMA
-- =============================================
SELECT
    'Users Table Schema' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 8. CHECK RECENT AUTH.USERS ENTRIES
-- =============================================
SELECT
    'Recent Auth Users' as check_type,
    id,
    email,
    created_at,
    confirmed_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- =============================================
-- 9. CHECK RECENT PUBLIC.USERS ENTRIES
-- =============================================
SELECT
    'Recent Public Users' as check_type,
    id,
    email,
    first_name,
    last_name,
    created_at,
    is_active
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- =============================================
-- 10. TEST TRIGGER FUNCTION DIRECTLY
-- =============================================
-- This tests if the function can be called manually
-- Note: This will NOT actually insert a test user
SELECT
    'Trigger Function Test' as check_type,
    pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'handle_new_user';

-- =============================================
-- 11. CHECK FOR CONSTRAINT VIOLATIONS
-- =============================================
SELECT
    'Table Constraints' as check_type,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'users' AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- =============================================
-- 12. CHECK IF PASSWORD_HASH COLUMN EXISTS
-- =============================================
SELECT
    'Password Hash Column Check' as check_type,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND table_schema = 'public'
            AND column_name = 'password_hash'
        ) THEN 'EXISTS (SHOULD BE REMOVED!)'
        ELSE 'NOT EXISTS (CORRECT)'
    END as status;

-- =============================================
-- 13. CHECK SUPABASE AUTH SETTINGS
-- =============================================
-- Check if email confirmation is required
SELECT
    'Auth Settings Check' as check_type,
    setting_name,
    setting_value
FROM pg_settings
WHERE name LIKE '%auth%'
LIMIT 20;
