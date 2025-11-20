-- =============================================
-- TEST AUTH SYSTEM AFTER FIX
-- =============================================
-- Run these queries after applying the fix to verify everything works
-- =============================================

-- =============================================
-- 1. Verify trigger function exists and is correct
-- =============================================
SELECT
  '1. TRIGGER FUNCTION' as test_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  COUNT(*) as count
FROM pg_proc
WHERE proname = 'handle_new_user' AND prosecdef = true;

-- =============================================
-- 2. Verify trigger is attached
-- =============================================
SELECT
  '2. TRIGGER ATTACHMENT' as test_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ ATTACHED'
    ELSE '❌ NOT ATTACHED'
  END as status,
  COUNT(*) as count
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_table = 'users'
  AND event_object_schema = 'auth';

-- =============================================
-- 3. Verify RLS is enabled
-- =============================================
SELECT
  '3. RLS STATUS' as test_name,
  CASE
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '⚠️ DISABLED (Test mode?)'
  END as status,
  rowsecurity as is_enabled
FROM pg_tables
WHERE tablename = 'users' AND schemaname = 'public';

-- =============================================
-- 4. Verify RLS policies exist
-- =============================================
SELECT
  '4. RLS POLICIES' as test_name,
  policyname,
  cmd,
  CASE
    WHEN policyname IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- =============================================
-- 5. Check for orphaned auth users
-- =============================================
SELECT
  '5. ORPHANED AUTH USERS' as test_name,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ NO ORPHANS'
    ELSE '❌ ORPHANS FOUND: ' || COUNT(*)::text
  END as status,
  COUNT(*) as orphaned_count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- If orphaned users found, show them:
SELECT
  'ORPHANED USER DETAILS' as info,
  au.id,
  au.email,
  au.created_at,
  au.raw_user_meta_data
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- =============================================
-- 6. Verify users table schema
-- =============================================
SELECT
  '6. USERS TABLE COLUMNS' as test_name,
  column_name,
  data_type,
  CASE
    WHEN column_name = 'password_hash' THEN '❌ SHOULD BE REMOVED'
    ELSE '✅ OK'
  END as status
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 7. Check recent users
-- =============================================
SELECT
  '7. RECENT USERS (AUTH)' as test_name,
  au.id,
  au.email,
  au.created_at,
  au.confirmed_at,
  CASE
    WHEN au.confirmed_at IS NULL THEN '⚠️ NOT CONFIRMED'
    ELSE '✅ CONFIRMED'
  END as confirmation_status
FROM auth.users au
ORDER BY au.created_at DESC
LIMIT 5;

SELECT
  '8. RECENT USERS (PUBLIC)' as test_name,
  pu.id,
  pu.email,
  pu.first_name,
  pu.last_name,
  pu.created_at,
  pu.is_active
FROM public.users pu
ORDER BY pu.created_at DESC
LIMIT 5;

-- =============================================
-- 9. Test user count sync
-- =============================================
SELECT
  '9. USER COUNT SYNC' as test_name,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.users) as public_users_count,
  CASE
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.users)
    THEN '✅ COUNTS MATCH'
    ELSE '❌ COUNTS MISMATCH'
  END as status;

-- =============================================
-- 10. Overall health check
-- =============================================
SELECT
  '10. OVERALL HEALTH' as test_name,
  CASE
    WHEN (
      -- Trigger exists
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
      AND
      -- Trigger attached
      EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
      AND
      -- No orphaned users
      NOT EXISTS (
        SELECT 1 FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL
      )
      AND
      -- No password_hash column
      NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password_hash'
      )
    ) THEN '✅ SYSTEM HEALTHY - Ready to test!'
    ELSE '❌ ISSUES DETECTED - Review above tests'
  END as status;

-- =============================================
-- FINAL INSTRUCTIONS
-- =============================================
SELECT '
==============================================
NEXT STEPS:
==============================================
1. Review all test results above
2. If all tests pass (✅), try to sign up/login
3. If signup fails, check browser console for errors
4. Run the diagnostic query to see the actual error
5. If email confirmation is required, check your email
==============================================
' as instructions;
