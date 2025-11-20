# URGENT AUTH FIX - Step-by-Step Guide

## Problem Summary
Users cannot sign up or log in after applying authentication fixes. The trigger that creates user profiles may not be working correctly.

## Root Causes Identified

1. **RLS Policy Blocking Trigger**: The INSERT policy `WITH CHECK (auth.uid() = id)` may block the trigger function even with `SECURITY DEFINER`
2. **Incorrect Metadata Access**: Trigger might not be reading user metadata correctly
3. **Email Confirmation**: Supabase may require email confirmation before allowing login
4. **Orphaned Users**: Users created in auth.users but not in public.users

## IMMEDIATE FIX - Run in Supabase SQL Editor

### Step 1: Run the Primary Fix
Open **Supabase Dashboard** → **SQL Editor** → Run this file:
```
fix-auth-urgent.sql
```

This will:
- Fix the trigger function to properly access metadata
- Update RLS policies to allow trigger to work
- Fix any orphaned users
- Grant proper permissions

### Step 2: Verify the Fix
After running Step 1, run this file:
```
test-auth-after-fix.sql
```

Check all test results:
- All should show ✅ (green checkmarks)
- If any show ❌ (red X), note which test failed

### Step 3: Test Signup/Login
1. Open your app in browser
2. Open browser console (F12 → Console tab)
3. Try to sign up with a new account
4. Watch for any error messages in console

### Step 4: If Still Not Working

#### Option A: Check Email Confirmation
If signup succeeds but login fails:

1. Check your email for confirmation link
2. Or run this in SQL Editor:
```sql
-- Check if users need confirmation
SELECT email, created_at, confirmed_at, email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
```

3. If `confirmed_at` is NULL, either:
   - Click the confirmation email link, OR
   - Manually confirm:
```sql
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'your-email@example.com';
```

4. Or disable email confirmation in Supabase:
   - Go to **Authentication** → **Settings**
   - Turn off "Enable email confirmations"

#### Option B: RLS is Still Blocking
If you get "permission denied" or "new row violates policy" errors:

Run this to temporarily disable RLS for testing:
```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

Try signup/login again. If it works, RLS is the issue.

Then re-enable RLS and run the alternative fix:
```
alternative-simple-fix.sql
```

#### Option C: Diagnose the Exact Error
Run this comprehensive diagnostic:
```
diagnose-auth-issue.sql
```

Send me the results, especially:
- Section 1: Trigger Function Status
- Section 2: Trigger Status
- Section 3: RLS Policies
- Section 5: Orphaned Auth Users

## Expected Behavior After Fix

### Signup Flow:
1. User fills registration form
2. Frontend calls `supabase.auth.signUp()`
3. Supabase creates entry in `auth.users`
4. **Trigger automatically creates entry in `public.users`**
5. Frontend waits 1 second for trigger
6. Frontend fetches user profile from `public.users`
7. User is logged in

### Login Flow:
1. User enters email/password
2. Frontend calls `supabase.auth.signInWithPassword()`
3. Supabase validates credentials
4. Frontend fetches user profile from `public.users`
5. Frontend updates last_login timestamp
6. User is logged in

## Files Created

1. **fix-auth-urgent.sql** - Primary fix (run this first)
2. **test-auth-after-fix.sql** - Verification tests
3. **diagnose-auth-issue.sql** - Detailed diagnostics
4. **alternative-simple-fix.sql** - Backup fix if primary doesn't work

## Common Error Messages and Solutions

### "Failed to fetch user profile"
**Cause**: Profile wasn't created in public.users
**Solution**: Run fix-auth-urgent.sql to fix orphaned users

### "new row violates row-level security policy"
**Cause**: RLS policy blocking insert
**Solution**: Run alternative-simple-fix.sql

### "Invalid login credentials"
**Cause**: User not confirmed OR wrong password
**Solution**: Check email confirmation status

### "Registration succeeded but failed to fetch profile"
**Cause**: Trigger created profile but RLS blocks SELECT
**Solution**: Check RLS SELECT policy exists

### Browser Console Shows "401 Unauthorized"
**Cause**: Supabase anon key issue or RLS blocking
**Solution**: Check .env.local has correct SUPABASE_URL and SUPABASE_ANON_KEY

## Verification Checklist

After applying the fix, verify:

- [ ] Trigger function `handle_new_user` exists
- [ ] Trigger `on_auth_user_created` is attached to `auth.users`
- [ ] RLS is enabled on `users` table
- [ ] At least 3 RLS policies exist on `users` table
- [ ] No orphaned users (auth.users without public.users entry)
- [ ] `password_hash` column is removed from `users` table
- [ ] Can sign up new user successfully
- [ ] Can log in with new user
- [ ] User profile data shows correctly after login

## Need More Help?

If still not working after all fixes:

1. Run `diagnose-auth-issue.sql`
2. Open browser console during signup/login
3. Share with me:
   - SQL diagnostic results (all sections)
   - Browser console errors
   - Network tab errors (filter by 'supabase')
   - Exact error message shown to user

## Quick Reference: File Locations

All files are in: `/Users/andrewkalumba/Desktop/claude/motorcycle-directory/`

- Application code: `src/lib/auth.ts`
- Login form: `src/components/auth/LoginForm.tsx`
- Register form: `src/components/auth/RegisterForm.tsx`
- Auth context: `src/contexts/AuthContext.tsx`
- Original migration: `migration-fix-auth-complete.sql`
