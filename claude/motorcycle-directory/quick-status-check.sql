-- =============================================
-- QUICK STATUS CHECK
-- =============================================
-- Run this single query to get a comprehensive status report
-- Copy the entire query and run it in Supabase SQL Editor
-- =============================================

SELECT * FROM (
SELECT
  '1. Password Hash Column Check' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name = 'password_hash'
    )
    THEN '❌ PROBLEM: password_hash column exists - MUST run migration!'
    ELSE '✅ GOOD: password_hash column removed'
  END AS status,
  'Critical' AS severity
UNION ALL
SELECT
  '2. Trigger Existence Check',
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE event_object_table = 'users'
        AND trigger_name = 'on_auth_user_created'
    )
    THEN '✅ GOOD: Auto-profile trigger exists'
    ELSE '❌ PROBLEM: Trigger missing - MUST run migration!'
  END,
  'Critical'
UNION ALL
SELECT
  '3. RLS Policy Check',
  CASE
    WHEN (
      SELECT COUNT(*) FROM pg_policies
      WHERE tablename = 'users'
        AND policyname IN ('Users can view own profile', 'Users can insert own profile', 'Users can update own profile')
    ) >= 3
    THEN '✅ GOOD: All required RLS policies exist'
    ELSE '⚠️ WARNING: Missing RLS policies - run migration!'
  END,
  'High'
UNION ALL
SELECT
  '4. Orphaned Users Check',
  CASE
    WHEN EXISTS (
      SELECT 1 FROM auth.users au
      LEFT JOIN public.users pu ON au.id = pu.id
      WHERE pu.id IS NULL
    )
    THEN '⚠️ WARNING: Users exist in auth without profiles - need manual fix'
    ELSE '✅ GOOD: All auth users have profiles'
  END,
  'Medium'
UNION ALL
SELECT
  '5. RLS Enabled Check',
  CASE
    WHEN (
      SELECT relrowsecurity
      FROM pg_class
      WHERE relname = 'users'
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    )
    THEN '✅ GOOD: RLS is enabled'
    ELSE '❌ PROBLEM: RLS is disabled - security risk!'
  END,
  'Critical'
UNION ALL
SELECT
  '6. User Count Comparison',
  'Auth users: ' || (SELECT COUNT(*) FROM auth.users)::text ||
  ' | Profile users: ' || (SELECT COUNT(*) FROM public.users)::text ||
  ' | Difference: ' || (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM public.users),
  'Info'
) AS status_checks
ORDER BY
  CASE severity
    WHEN 'Critical' THEN 1
    WHEN 'High' THEN 2
    WHEN 'Medium' THEN 3
    ELSE 4
  END,
  check_name;

-- =============================================
-- INTERPRETATION GUIDE:
-- =============================================
--
-- ✅ All checks passed:
--    → Your authentication system is properly configured
--    → You can proceed with testing registration/login
--
-- ❌ Any critical issues:
--    → Run migration-fix-auth-complete.sql immediately
--    → Then run this check again
--
-- ⚠️ Orphaned users warning:
--    → Run fix-orphaned-users.sql to create missing profiles
--
-- =============================================
