-- =============================================
-- FIX ORPHANED USERS
-- =============================================
-- This script creates profiles for auth users who don't have them
-- Run this AFTER running migration-fix-auth-complete.sql
-- =============================================

-- First, let's see how many orphaned users exist
SELECT
  COUNT(*) AS orphaned_user_count,
  'Users in auth.users without profiles in public.users' AS description
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Show the details of orphaned users
SELECT
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  au.raw_user_meta_data->>'first_name' AS metadata_first_name,
  au.raw_user_meta_data->>'last_name' AS metadata_last_name,
  'Missing profile in public.users' AS status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- =============================================
-- CREATE MISSING PROFILES
-- =============================================
-- This will create profiles for all orphaned users
-- using metadata from auth.users or default values

INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  phone,
  address,
  city,
  country,
  postal_code,
  is_active,
  created_at,
  updated_at
)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', 'User') AS first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', 'Name') AS last_name,
  COALESCE(au.raw_user_meta_data->>'phone', NULL) AS phone,
  COALESCE(au.raw_user_meta_data->>'address', NULL) AS address,
  COALESCE(au.raw_user_meta_data->>'city', NULL) AS city,
  COALESCE(au.raw_user_meta_data->>'country', NULL) AS country,
  COALESCE(au.raw_user_meta_data->>'postal_code', NULL) AS postal_code,
  true AS is_active,
  au.created_at,
  NOW() AS updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify the fix
SELECT
  'Fixed' AS result,
  COUNT(*) AS profiles_created
FROM public.users
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN (
    SELECT id FROM public.users WHERE created_at < NOW() - INTERVAL '1 second'
  ) old_pu ON au.id = old_pu.id
  WHERE old_pu.id IS NULL
);

-- Final verification: should be zero
SELECT
  COUNT(*) AS remaining_orphaned_users,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ All auth users now have profiles!'
    ELSE '⚠️ Still have orphaned users - check for errors'
  END AS status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- =============================================
-- NOTES:
-- =============================================
-- After running this script:
-- 1. All existing auth users will have profiles
-- 2. Users can now log in successfully
-- 3. They can update their profiles to add missing info
-- 4. Future users will get profiles automatically via trigger
-- =============================================
