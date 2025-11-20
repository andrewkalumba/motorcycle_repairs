# Database Migration Instructions

Your Supabase connection is working, but the SQL Editor in the dashboard is experiencing a "Failed to fetch" error. Here are alternative ways to execute the `database-schema.sql` file.

## ✅ Connection Status
- **Supabase URL:** https://mcfyffbyiohcsimzwhoh.supabase.co
- **Connection Test:** PASSED (3149 records in motorcycle_repairs table)
- **Issue:** SQL Editor in dashboard not working

---

## Option 1: Fix SQL Editor (Recommended - Quickest)

The SQL Editor error is usually a browser/cache issue:

### Steps:
1. **Try these fixes:**
   - Clear browser cache and cookies for `supabase.com`
   - Use Incognito/Private browsing mode
   - Try a different browser (Chrome, Firefox, Safari)
   - Disable browser extensions (especially ad blockers)

2. **Check if project is paused:**
   - Visit: https://supabase.com/dashboard/project/mcfyffbyiohcsimzwhoh
   - If you see a "Resume" button, click it

3. **Run the migration:**
   - Go to SQL Editor: https://supabase.com/dashboard/project/mcfyffbyiohcsimzwhoh/sql/new
   - Copy the entire contents of `database-schema.sql`
   - Paste into the editor
   - Click "Run" or press Cmd/Ctrl + Enter

---

## Option 2: Use Direct Database Connection (psql)

### Prerequisites:
- Get your database password from Supabase Dashboard
- Install PostgreSQL client (psql)

### Steps:

1. **Get database password:**
   - Go to: https://supabase.com/dashboard/project/mcfyffbyiohcsimzwhoh/settings/database
   - Find "Database Password" section
   - Copy or reset your password

2. **Install psql** (if not already installed):
   ```bash
   # macOS (using Homebrew)
   brew install postgresql

   # Or check if already installed:
   psql --version
   ```

3. **Run the migration:**
   ```bash
   # Replace [YOUR-PASSWORD] with your actual database password
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.mcfyffbyiohcsimzwhoh.supabase.co:5432/postgres" -f database-schema.sql
   ```

---

## Option 3: Install Supabase CLI

### Steps:

1. **Install Supabase CLI:**
   ```bash
   # Using npm (with sudo if needed)
   sudo npm install -g supabase

   # OR using Homebrew (macOS)
   brew install supabase/tap/supabase

   # OR download binary directly
   # Visit: https://github.com/supabase/cli/releases
   ```

2. **Login and link project:**
   ```bash
   supabase login
   supabase link --project-ref mcfyffbyiohcsimzwhoh
   ```

3. **Run migration:**
   ```bash
   supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.mcfyffbyiohcsimzwhoh.supabase.co:5432/postgres" < database-schema.sql
   ```

---

## Option 4: Use Service Role Key (Advanced)

If you prefer to run migrations from Node.js:

1. **Get Service Role Key:**
   - Go to: https://supabase.com/dashboard/project/mcfyffbyiohcsimzwhoh/settings/api
   - Copy the `service_role` key (⚠️  Keep this SECRET!)

2. **Add to `.env.local`:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Run migration script:**
   ```bash
   node run-migration.js
   ```

Note: The Supabase JS client doesn't support all DDL operations, so this might not work for complex schemas. Use psql or SQL Editor instead.

---

## Verify Migration Success

After running the migration, verify it worked:

```bash
node test-connection.js
```

Or check in your application that the new tables exist:
- users
- bikes
- service_history
- appointments
- maintenance_reminders
- shop_reviews
- shop_specializations
- shop_services

---

## Troubleshooting

### "Failed to fetch" error persists:
- Your Supabase project might be paused (inactive for 7+ days on free tier)
- Network/firewall blocking access to api.supabase.com
- Browser extensions interfering with requests

### Can't connect with psql:
- Verify database password is correct
- Check firewall isn't blocking port 5432
- Ensure you're using the correct connection string

### Tables already exist:
The schema uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times. However, policies and triggers might give errors if they already exist. You can drop them first or modify the schema to use `CREATE OR REPLACE` where applicable.

---

## Need Help?

If none of these options work:
1. Check Supabase Status Page: https://status.supabase.com/
2. Contact Supabase Support: https://supabase.com/dashboard/support
3. Share the specific error message you're getting
