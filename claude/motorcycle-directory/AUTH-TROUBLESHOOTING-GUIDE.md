# Authentication Troubleshooting Guide

## Critical Issues Identified

Your authentication system has **fundamental architectural conflicts** that are preventing users from registering and logging in. This guide will help you fix them.

---

## Root Cause Analysis

### Problem 1: Password Hash Column Conflict
**Location**: `database-schema.sql` Line 11
**Issue**: The `users` table has a `password_hash` column marked as `NOT NULL`, but Supabase Auth manages passwords in its own `auth.users` table, not your custom table.

**Impact**: When registering, the code tries to insert a user profile without providing `password_hash`, causing PostgreSQL to reject the insert due to the NOT NULL constraint.

---

### Problem 2: Manual Profile Creation vs. Automatic
**Location**: `src/lib/auth.ts` Lines 47-62
**Issue**: The code manually inserts user profiles after Supabase Auth signup, which can fail due to:
- Race conditions (auth session not fully established)
- RLS policies blocking the insert if `auth.uid()` returns NULL
- Missing or incomplete data

**Impact**: "Failed to create user profile" error during registration.

---

### Problem 3: Missing Profiles for Existing Users
**Issue**: If users were created in `auth.users` but failed to create profiles in `public.users`, they can authenticate but have no profile data.

**Impact**: "Failed to fetch user profile" error during login.

---

## The Complete Fix

### Step 1: Run Diagnostic Queries

1. Open Supabase Dashboard → SQL Editor
2. Run the queries in `diagnose-auth-issues.sql`
3. Review the results to confirm the issues

**Key things to check:**
- Does `password_hash` column exist in `users` table? (Query #1)
- Is the trigger `on_auth_user_created` present? (Query #4)
- Are there users in `auth.users` without profiles in `public.users`? (Query #7)

---

### Step 2: Apply the Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `migration-fix-auth-complete.sql`
3. Paste and run it
4. Verify success (no errors should appear)

**What this migration does:**
- Removes the `password_hash` column
- Updates RLS policies for proper auth flow
- Creates a database trigger that automatically creates user profiles
- Ensures no race conditions between `auth.users` and `public.users`

---

### Step 3: Verify the Migration

Run these verification queries in Supabase SQL Editor:

```sql
-- 1. Confirm password_hash is removed
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'password_hash';
-- Should return: 0 rows

-- 2. Confirm trigger exists
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'users' AND trigger_name = 'on_auth_user_created';
-- Should return: on_auth_user_created

-- 3. Check RLS policies
SELECT policy_name FROM pg_policies WHERE table_name = 'users';
-- Should return: Users can view own profile, Users can insert own profile, Users can update own profile
```

---

### Step 4: Test Authentication

#### Test Registration:
1. Open your application
2. Navigate to the registration page
3. Fill in the form with:
   - Email: `test@example.com`
   - Password: `TestPass123!`
   - First Name: `Test`
   - Last Name: `User`
4. Submit the form

**Expected Outcome**: User should be created successfully and automatically logged in.

**If it fails**, check browser console for errors and run:
```sql
SELECT * FROM auth.users WHERE email = 'test@example.com';
SELECT * FROM public.users WHERE email = 'test@example.com';
```

#### Test Login:
1. Log out (if logged in)
2. Navigate to login page
3. Enter credentials
4. Submit

**Expected Outcome**: User should log in successfully and see their dashboard.

---

### Step 5: Fix Existing Users Without Profiles

If you have existing users in `auth.users` who don't have profiles in `public.users`:

```sql
-- Find them
SELECT au.id, au.email FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Create profiles for them
INSERT INTO public.users (id, email, first_name, last_name, is_active)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', 'User'),
  COALESCE(au.raw_user_meta_data->>'last_name', 'Name'),
  true
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

---

## How the New System Works

### Registration Flow:
1. User fills out registration form
2. Frontend calls `registerUser()` in `src/lib/auth.ts`
3. `supabase.auth.signUp()` creates user in `auth.users` table
4. **Database trigger automatically creates profile in `public.users`**
5. Frontend updates profile with additional data (phone, address, etc.)
6. User is logged in automatically

### Login Flow:
1. User enters credentials
2. Frontend calls `loginUser()` in `src/lib/auth.ts`
3. `supabase.auth.signInWithPassword()` authenticates user
4. Frontend fetches user profile from `public.users`
5. Profile is stored in React context
6. User sees their dashboard

---

## Common Errors and Solutions

### Error: "Failed to create user profile"
**Cause**: Either password_hash column still exists, or RLS policies are blocking insert
**Solution**: Run the migration again, check diagnostic queries

### Error: "Failed to fetch user profile"
**Cause**: User exists in auth.users but not in public.users
**Solution**: Run Step 5 to create missing profiles

### Error: "new row violates row-level security policy"
**Cause**: RLS policies are too restrictive or auth session isn't established
**Solution**: The migration fixes this with proper policies and triggers

### Error: "duplicate key value violates unique constraint"
**Cause**: Trying to create a profile that already exists
**Solution**: This is actually fine - the trigger uses `ON CONFLICT DO NOTHING`

### Browser Console: PostgreSQL error about null value in column "password_hash"
**Cause**: Migration hasn't been run yet
**Solution**: Run migration-fix-auth-complete.sql

---

## Environment Variables

Ensure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**To verify they're set correctly:**
```bash
cd /Users/andrewkalumba/Desktop/claude/motorcycle-directory
grep SUPABASE .env.local
```

---

## Debugging Tips

### 1. Check Browser Console
Open DevTools (F12) → Console tab
Look for:
- Network errors (failed requests to Supabase)
- JavaScript errors
- Supabase error messages

### 2. Check Supabase Logs
Supabase Dashboard → Logs → Database
Look for:
- Policy violations
- Constraint violations
- Trigger errors

### 3. Test with Service Role Key (Temporary)
To bypass RLS and test if it's a policy issue:
```typescript
// ONLY FOR DEBUGGING - DO NOT COMMIT
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, SERVICE_ROLE_KEY);
```

### 4. Enable Detailed Logging
Add to `src/lib/auth.ts`:
```typescript
const { data, error } = await supabase.from('users').select('*');
console.log('Supabase response:', { data, error });
```

---

## Migration Checklist

- [ ] Run diagnostic queries from `diagnose-auth-issues.sql`
- [ ] Backup your database (Supabase Dashboard → Database → Backups)
- [ ] Run `migration-fix-auth-complete.sql`
- [ ] Verify migration with verification queries
- [ ] Test user registration
- [ ] Test user login
- [ ] Fix existing users without profiles (if any)
- [ ] Remove debugging code
- [ ] Test on production (if applicable)

---

## Files Modified

1. **Created**: `/Users/andrewkalumba/Desktop/claude/motorcycle-directory/migration-fix-auth-complete.sql`
   - Comprehensive migration to fix all auth issues

2. **Created**: `/Users/andrewkalumba/Desktop/claude/motorcycle-directory/diagnose-auth-issues.sql`
   - Diagnostic queries to identify current issues

3. **Updated**: `/Users/andrewkalumba/Desktop/claude/motorcycle-directory/src/lib/auth.ts`
   - Modified `registerUser()` to work with trigger-based profile creation
   - Added fallback error messages
   - Added retry logic with delay

4. **Created**: `/Users/andrewkalumba/Desktop/claude/motorcycle-directory/AUTH-TROUBLESHOOTING-GUIDE.md`
   - This comprehensive guide

---

## What Changed in the Code

### Before (Broken):
```typescript
// Manually insert profile - FAILS if password_hash is required
const { data, error } = await supabase
  .from('users')
  .insert([{
    id: authData.user.id,
    email: userData.email,
    password_hash: ??? // Missing - causes error!
    // ... other fields
  }]);
```

### After (Fixed):
```typescript
// Supabase Auth signup
await supabase.auth.signUp({ email, password });
// Trigger automatically creates profile in users table
// Wait for trigger to complete
await new Promise(resolve => setTimeout(resolve, 1000));
// Update with additional data
await supabase.from('users').update({ phone, address }).eq('id', userId);
```

---

## Architecture Explanation

### Supabase Auth Tables:
- `auth.users` - Managed by Supabase, stores emails, passwords (hashed), metadata
- `public.users` - Your custom table, stores profile data (name, phone, address, etc.)

### The Correct Approach:
1. Supabase Auth owns authentication (emails, passwords, sessions)
2. Your `users` table owns profile data (names, addresses, preferences)
3. They're linked by UUID (auth.users.id = public.users.id)
4. A trigger keeps them synchronized

---

## Still Having Issues?

If authentication still doesn't work after following this guide:

1. **Share these diagnostic results:**
   - Results from queries #1, #4, #7 in `diagnose-auth-issues.sql`
   - Browser console errors
   - Supabase logs

2. **Check these:**
   - Is email confirmation disabled in Supabase Auth settings?
   - Are you using the correct Supabase URL and anon key?
   - Is RLS enabled on the users table?

3. **Try this test:**
   ```sql
   -- Disable RLS temporarily to test
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   -- Try registration
   -- Then re-enable
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ```

---

## Contact Information

For further assistance, provide:
- Results from diagnostic queries
- Browser console errors (screenshot)
- Supabase error logs
- Your Supabase project URL (not the keys!)

---

**Last Updated**: 2025-11-19
**Version**: 1.0 - Comprehensive Auth Fix
