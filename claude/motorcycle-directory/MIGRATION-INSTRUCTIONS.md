# Database Migration Instructions

## Overview
This migration fixes two critical authentication issues:
1. **"Failed to fetch user profile" error** - Caused by missing INSERT policy on users table
2. **Email confirmation** - Removed to simplify authentication flow

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://mcfyffbyiohcsimzwhoh.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `migration-fix-auth.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db reset
```

This will recreate the database using the updated `database-schema.sql` file.

## What Changed

### 1. Added Missing INSERT Policy
**Before:** Users could not insert their profile into the database after registration, causing the "Failed to fetch user profile" error.

**After:** Users can now insert their own profile record during registration.

```sql
CREATE POLICY "Users can insert own profile"
ON users
FOR INSERT
WITH CHECK (auth.uid() = id);
```

### 2. Removed Email Verification
**Removed from:**
- Database: `email_verified` column dropped from `users` table
- TypeScript: `emailVerified` field removed from `User` interface
- Backend: Email verification logic removed from all auth functions

## Testing the Fix

After running the migration:

1. **Test Registration:**
   - Go to your app's registration page
   - Create a new account
   - Verify that registration completes without the "Failed to fetch user profile" error
   - You should be automatically logged in after registration

2. **Test Login:**
   - Log out if needed
   - Log in with your credentials
   - Verify that login works without errors

3. **Verify Database:**
   ```sql
   -- Check policies
   SELECT policy_name, policy_command
   FROM pg_policies
   WHERE table_name = 'users';

   -- Check columns
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'users';
   ```

## Rollback (If Needed)

If you need to rollback these changes:

```sql
-- Add back email_verified column
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Remove the INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
```

## Need Help?

If you encounter any issues after running the migration, check:
- Supabase logs in the dashboard
- Browser console for frontend errors
- Your app's error logs

Common issues:
- **Still getting errors?** Make sure the migration ran successfully in Supabase
- **Can't run migration?** Check your Supabase project permissions
- **Old users affected?** Existing users should not be affected by these changes
