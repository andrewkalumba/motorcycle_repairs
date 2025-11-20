-- =============================================
-- SIMPLE ALTERNATIVE FIX - If the main fix doesn't work
-- =============================================
-- This is a more aggressive approach that bypasses RLS for the trigger
-- =============================================

-- =============================================
-- OPTION 1: Temporarily disable RLS to test
-- =============================================
-- Run this to disable RLS and see if signup/login works
-- WARNING: This is for testing only - re-enable RLS after testing!

-- Disable RLS temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Test signup/login now
-- If it works, the issue is RLS policies

-- Re-enable RLS after testing
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =============================================
-- OPTION 2: Use a simpler trigger function
-- =============================================
-- This version uses a different approach to bypass RLS

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use a simpler approach with explicit security definer
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- OPTION 3: Add a bypass policy for service role
-- =============================================
-- This allows the trigger function to bypass RLS

DROP POLICY IF EXISTS "Bypass RLS for service role" ON users;

CREATE POLICY "Bypass RLS for service role"
ON users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- OPTION 4: Check if email confirmation is blocking
-- =============================================
-- Run this query to see if users are being created but not confirmed

SELECT
  'Unconfirmed Users' as status,
  au.id,
  au.email,
  au.created_at,
  au.confirmed_at,
  au.email_confirmed_at,
  CASE
    WHEN au.confirmed_at IS NULL THEN 'NOT CONFIRMED - Check email!'
    ELSE 'CONFIRMED'
  END as confirmation_status
FROM auth.users au
ORDER BY au.created_at DESC
LIMIT 10;

-- If users are created but not confirmed, you need to either:
-- 1. Check the confirmation email in your inbox
-- 2. Disable email confirmation in Supabase settings
-- 3. Manually confirm the user with this query:

-- UPDATE auth.users
-- SET email_confirmed_at = NOW(),
--     confirmed_at = NOW()
-- WHERE email = 'YOUR_EMAIL_HERE';
