# Session Saving Issue - Complete Fix Guide

## Problem
Sessions are being saved successfully (you see the success message in the console), but they don't appear when you try to load them. This is happening because of Row Level Security (RLS) policies in Supabase.

## Root Cause
The Supabase service role key is either:
1. Not set in your `.env.local` file, OR
2. The RLS policies are blocking the query even with the service role key

## Step-by-Step Fix

### Step 1: Check Your Environment Variables

Open your `.env.local` file and make sure you have **all three** of these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**How to get the SERVICE_ROLE_KEY:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on "Settings" (gear icon) in the left sidebar
4. Click on "API"
5. Scroll down to "Project API keys"
6. Copy the **`service_role`** key (NOT the anon key!)
7. Paste it as `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local` file

**IMPORTANT:** After adding the key, restart your dev server:
```bash
# Stop the server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 2: Run the RLS Fix Script

Even with the service role key, RLS policies might block access. Run this SQL in your Supabase SQL Editor:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Paste the contents of `fix-sessions-rls.sql`
6. Click "Run"

### Step 3: Verify the Fix

After completing steps 1 and 2:

1. **Run the diagnostic script:**
   ```bash
   node check-sessions.js
   ```

   This will tell you:
   - ✓ If your environment variables are set correctly
   - ✓ If the sessions table exists
   - ✓ How many sessions are in the database
   - ✓ If there are any RLS or permission issues

2. **Upload a test statement:**
   - Go to your dashboard
   - Upload a PDF bank statement
   - Check the console for success message
   - Go to your profile page
   - The saved session should now appear!

## Common Issues

### "SUPABASE_SERVICE_ROLE_KEY: ✗ Missing"
- You haven't added the service role key to `.env.local`
- Follow Step 1 above

### "ERROR fetching sessions: relation 'sessions' does not exist"
- The sessions table hasn't been created yet
- Run `CREATE_SESSIONS_TABLE.sql` in Supabase SQL Editor first
- Then run `fix-sessions-rls.sql`

### "Found 0 sessions" after uploading
- Check if you're logged in as the same user
- Clear browser cache and localStorage
- Try uploading again

### Sessions saved but still not showing in profile
- The RLS policies might still be blocking
- Make sure you ran `fix-sessions-rls.sql`
- Check the browser console for error messages
- Check the terminal/server logs for `[getUserSessions]` messages

## Technical Details

The session saving process works like this:

1. **Upload PDF** → FileUpload component
2. **Parse PDF** → `/api/parse-statement-stream`
3. **Save Session** → `/api/sessions/save` (uses service role key to INSERT)
4. **Fetch Sessions** → `/api/sessions/list` → `getUserSessions()` (uses service role key to SELECT)

The service role key is needed because it bypasses RLS policies. Without it, the API can INSERT (create) sessions but cannot SELECT (read) them back, even though it's the same user!

## Still Not Working?

If you've followed all steps and it's still not working:

1. Share the output of `node check-sessions.js`
2. Share any error messages from the browser console
3. Share any error messages from the terminal/server logs
4. Check if you have the latest code from git

## Alternative: Disable RLS (NOT RECOMMENDED FOR PRODUCTION)

If you just want to test locally and don't care about security:

```sql
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
```

**WARNING:** This makes your sessions table publicly accessible! Only use this for local testing.
