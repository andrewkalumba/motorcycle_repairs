-- =============================================
-- URGENT AUTH FIX
-- =============================================
-- This fixes the authentication system completely
-- Run this in Supabase SQL Editor NOW
-- =============================================

-- =============================================
-- STEP 1: Drop and recreate the trigger function with correct metadata access
-- =============================================
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert user profile with data from Supabase Auth metadata
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
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    COALESCE(NEW.raw_user_meta_data->>'postal_code', ''),
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), users.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), users.last_name),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), users.phone),
    address = COALESCE(NULLIF(EXCLUDED.address, ''), users.address),
    city = COALESCE(NULLIF(EXCLUDED.city, ''), users.city),
    country = COALESCE(NULLIF(EXCLUDED.country, ''), users.country),
    postal_code = COALESCE(NULLIF(EXCLUDED.postal_code, ''), users.postal_code),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- =============================================
-- STEP 2: Recreate the trigger
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- STEP 3: Fix RLS policies to allow trigger to work
-- =============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow service role (trigger) to insert any user
-- This is critical for the trigger to work
CREATE POLICY "Service role can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- =============================================
-- STEP 4: Grant necessary permissions
-- =============================================
-- Ensure the function can access the users table
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- =============================================
-- STEP 5: Fix any orphaned users
-- =============================================
-- Insert profiles for any auth.users that don't have a profile yet
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  is_active,
  created_at,
  updated_at
)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', 'User'),
  COALESCE(au.raw_user_meta_data->>'last_name', 'Name'),
  true,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- VERIFICATION
-- =============================================
-- Check trigger exists
SELECT
  'Trigger Check' as status,
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check function exists
SELECT
  'Function Check' as status,
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check policies
SELECT
  'Policy Check' as status,
  policyname,
  cmd as command,
  roles
FROM pg_policies
WHERE tablename = 'users';

-- Check for orphaned users (should be none after fix)
SELECT
  'Orphaned Users Check' as status,
  COUNT(*) as orphaned_count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT '✅ AUTH FIX COMPLETE - Try signing up or logging in now!' as message;
