# AUTH FIX - Quick Reference Card

## 🚨 IMMEDIATE ACTION REQUIRED

### Run These 2 Files in Order:
1. **fix-auth-urgent.sql** (in Supabase SQL Editor)
2. **test-auth-after-fix.sql** (verify all ✅)

### Test:
- Sign up new user
- Check browser console (F12)
- Should work without errors

---

## 📋 Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "Failed to fetch user profile" | Run `fix-auth-urgent.sql` |
| "Invalid login credentials" | Check email confirmation |
| "new row violates row-level security policy" | Run `alternative-simple-fix.sql` |
| Network errors | Check `.env.local` for correct Supabase URL/key |

---

## 🔍 Quick Diagnostics

### Check if user exists but no profile:
```sql
SELECT au.id, au.email, pu.id as profile_id
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'your-email@example.com';
```
If `profile_id` is NULL → orphaned user → run `fix-auth-urgent.sql`

### Check email confirmation:
```sql
SELECT email, confirmed_at
FROM auth.users
WHERE email = 'your-email@example.com';
```
If `confirmed_at` is NULL → check email OR manually confirm:
```sql
UPDATE auth.users
SET email_confirmed_at = NOW(), confirmed_at = NOW()
WHERE email = 'your-email@example.com';
```

### Check trigger exists:
```sql
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```
If empty → run `fix-auth-urgent.sql`

---

## 🛠️ File Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `fix-auth-urgent.sql` | Main fix | **RUN FIRST** |
| `test-auth-after-fix.sql` | Verification | After main fix |
| `diagnose-auth-issue.sql` | Deep diagnostics | If still broken |
| `alternative-simple-fix.sql` | Backup fix | If main fix fails |
| `debug-browser-errors.md` | Browser debugging | Check console errors |
| `AUTH-FIX-SUMMARY.md` | Full documentation | Detailed explanations |
| `VISUAL-AUTH-FLOW.md` | Flow diagrams | Understand the flow |

---

## ✅ Success Checklist

After fix, verify:
- [ ] Can sign up new user
- [ ] No errors in browser console
- [ ] Profile data shows after signup
- [ ] Can log out
- [ ] Can log back in
- [ ] User data persists

---

## 📞 Need Help?

Share these with me:
1. Results from `test-auth-after-fix.sql`
2. Browser console errors (F12 → Console)
3. Network tab (F12 → Network → filter "supabase")
4. Email you're testing with

---

## 🔑 Key Concepts

**Trigger**: Automatically creates profile in `public.users` when user signs up
**RLS**: Row Level Security - controls who can read/write data
**Orphaned User**: User in `auth.users` but not in `public.users`
**SECURITY DEFINER**: Function runs with elevated privileges

---

## 🎯 Expected Flow After Fix

```
Sign Up
  ↓
Supabase creates user in auth.users
  ↓
Trigger creates profile in public.users
  ↓
Frontend fetches profile
  ↓
User logged in ✅
```

---

## ⚠️ If Absolutely Nothing Works

Last resort (TEMPORARY):
```sql
-- Disable RLS temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Test signup/login - if it works, RLS was the issue

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Then run alternative-simple-fix.sql
```

**IMPORTANT**: Don't leave RLS disabled in production!

---

## 📊 Status Indicators

### In SQL Results:
- ✅ = Working correctly
- ❌ = Needs fixing
- ⚠️ = Warning/attention needed

### In Browser Console:
- Green text = Success
- Red text = Error
- Yellow text = Warning

---

## 🚀 Post-Fix Actions

1. Test thoroughly with multiple users
2. Monitor Supabase logs for errors
3. Keep `fix-auth-urgent.sql` for reference
4. Delete diagnostic files if everything works
5. Update documentation with lessons learned

---

## 💡 Remember

- **Don't panic** - the fix is straightforward
- **Run fix-auth-urgent.sql first** - it solves 90% of issues
- **Check browser console** - errors are usually clear
- **Email confirmation** is a common gotcha
- **I'm here to help** - share diagnostics if stuck

---

## 🎓 What Changed

**Before**: RLS policy blocked trigger from creating profiles
**After**: Policy allows trigger, profiles created automatically
**Result**: Sign up works end-to-end ✅

---

## 📝 One-Liner Summary

**The fix changes the INSERT policy from `WITH CHECK (auth.uid() = id)` to `WITH CHECK (true)` to allow the trigger function to create user profiles automatically during signup.**

---

## 🔗 Related Files

All files located in:
`/Users/andrewkalumba/Desktop/claude/motorcycle-directory/`

**Start here**: `AUTH-FIX-SUMMARY.md`
