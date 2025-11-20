# Browser Console Debugging Guide

## How to Check Browser Errors

1. **Open Developer Tools**
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Firefox: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - Safari: Enable Developer menu in Preferences, then press `Cmd+Option+C`

2. **Open Console Tab**
   - Click on "Console" tab in Developer Tools
   - Clear the console (trash can icon or `Ctrl+L`)

3. **Open Network Tab (in a second window/split)**
   - Click on "Network" tab
   - Make sure "Preserve log" is checked
   - Filter by "Fetch/XHR" to see API calls

## What to Look For During Signup

### Step 1: Try to Sign Up
1. Clear console
2. Fill in registration form
3. Click "Create Account"
4. Watch both Console and Network tabs

### Step 2: Check Console for Errors

Look for these error patterns:

#### Error Pattern 1: "Failed to fetch"
```
Error: Failed to fetch
```
**Meaning**: Network issue or CORS problem
**Check**: Network tab - is the request blocked?

#### Error Pattern 2: "new row violates row-level security policy"
```
Error: new row violates row-level security policy for table "users"
```
**Meaning**: RLS policy blocking insert
**Fix**: Run `alternative-simple-fix.sql`

#### Error Pattern 3: "duplicate key value violates unique constraint"
```
Error: duplicate key value violates unique constraint "users_pkey"
```
**Meaning**: User already exists in database
**Fix**: Try different email OR delete existing user

#### Error Pattern 4: "Failed to fetch user profile"
```
Registration succeeded but failed to fetch profile
```
**Meaning**: Trigger didn't create profile OR RLS blocking SELECT
**Fix**: Run `fix-auth-urgent.sql`

#### Error Pattern 5: "Invalid login credentials"
```
Error: Invalid login credentials
```
**Meaning**: Email not confirmed OR wrong credentials
**Fix**: Check email confirmation

### Step 3: Check Network Tab

Look for requests to Supabase:

#### Successful Signup Request
```
POST https://xxxxx.supabase.co/auth/v1/signup
Status: 200 OK
Response: { "user": { "id": "...", "email": "..." } }
```

#### Successful Profile Insert
```
POST https://xxxxx.supabase.co/rest/v1/users
Status: 201 Created
```

#### Failed Profile Insert (RLS Issue)
```
POST https://xxxxx.supabase.co/rest/v1/users
Status: 403 Forbidden
Response: { "message": "new row violates row-level security policy" }
```

#### Failed Profile Fetch (Not Found)
```
GET https://xxxxx.supabase.co/rest/v1/users?id=eq.xxxxx
Status: 200 OK
Response: [] (empty array - profile not created!)
```

## What to Look For During Login

### Step 1: Try to Log In
1. Clear console
2. Fill in login form
3. Click "Sign In"
4. Watch Console and Network

### Step 2: Check Console for Errors

#### Error Pattern 1: "Invalid login credentials"
```
Error: Invalid login credentials
```
**Possible Causes**:
1. Wrong password
2. Email not confirmed
3. User doesn't exist

**Check SQL**:
```sql
SELECT id, email, confirmed_at, email_confirmed_at
FROM auth.users
WHERE email = 'your-email@example.com';
```

#### Error Pattern 2: "Failed to fetch user profile"
```
Error: Failed to fetch user profile
```
**Meaning**: User exists in auth.users but not in public.users
**Fix**: Run this SQL:
```sql
-- Check if orphaned
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'your-email@example.com' AND pu.id IS NULL;
```

### Step 3: Check Network Tab

#### Successful Login
```
POST https://xxxxx.supabase.co/auth/v1/token?grant_type=password
Status: 200 OK
Response: { "access_token": "...", "user": { "id": "..." } }
```

#### Failed Login (Wrong Credentials)
```
POST https://xxxxx.supabase.co/auth/v1/token?grant_type=password
Status: 400 Bad Request
Response: { "error": "invalid_grant", "error_description": "Invalid login credentials" }
```

## Common Error Messages Translation

| Error Message | What It Means | How to Fix |
|--------------|---------------|------------|
| `Failed to fetch` | Network/CORS issue | Check Supabase URL and anon key |
| `new row violates row-level security policy` | RLS blocking insert | Run `alternative-simple-fix.sql` |
| `Invalid login credentials` | Wrong password or not confirmed | Check email confirmation |
| `Failed to fetch user profile` | Profile not in public.users | Run `fix-auth-urgent.sql` |
| `duplicate key value violates unique constraint` | User already exists | Use different email |
| `Registration succeeded but failed to fetch profile` | Trigger didn't work | Run diagnostics |

## SQL Queries to Run for Each Error

### For "Invalid login credentials"
```sql
-- Check if user exists and is confirmed
SELECT
  id,
  email,
  created_at,
  confirmed_at,
  email_confirmed_at,
  CASE
    WHEN confirmed_at IS NULL THEN 'NOT CONFIRMED - Check email!'
    ELSE 'CONFIRMED - Password might be wrong'
  END as status
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE';
```

### For "Failed to fetch user profile"
```sql
-- Check if profile exists
SELECT
  'Auth User' as source,
  au.id,
  au.email,
  au.confirmed_at
FROM auth.users au
WHERE au.email = 'YOUR_EMAIL_HERE'

UNION ALL

SELECT
  'Public User' as source,
  pu.id,
  pu.email,
  pu.created_at::text as confirmed_at
FROM public.users pu
WHERE pu.email = 'YOUR_EMAIL_HERE';
```

### For "new row violates row-level security policy"
```sql
-- Check RLS policies
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

## Share These with Me for Diagnosis

If you're still having issues, share:

1. **Console Errors** (copy exact text):
   ```
   [Paste console errors here]
   ```

2. **Network Request Details**:
   - Request URL
   - Status Code
   - Response body

3. **SQL Query Results** (from relevant query above):
   ```
   [Paste SQL results here]
   ```

4. **What you were doing**:
   - [ ] Signing up new user
   - [ ] Logging in existing user
   - Email used: _______________

With this information, I can pinpoint the exact issue and provide a targeted fix.
