# Fix for 400 Error When Creating Problems

## Problem
Getting a **400 Bad Request** error when trying to create or save problems in the admin panel.

## Root Cause
The `language` column is missing from the `problems` table in your Supabase database. The migration file exists but hasn't been applied yet.

## Solution

You need to apply the migration to add the `language` column. Here are two methods:

---

### Method 1: Apply via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `opkhvihnzuhyusitcfpd`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run this SQL**
   ```sql
   -- Add language column to problems table
   ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'javascript';
   ALTER TABLE public.problems ADD CONSTRAINT IF NOT EXISTS problems_language_check CHECK (language IN ('javascript', 'python', 'c', 'cpp', 'java'));
   ```

4. **Click "Run"**
   - The migration will be applied immediately

5. **Verify**
   - Go back to your app and try creating a problem again
   - It should work now! ✅

---

### Method 2: Using Supabase CLI (If you have it installed)

```bash
# Navigate to your project
cd d:\backup\logic-ladder-pro

# Apply all pending migrations
supabase db push
```

---

## Verification

After applying the migration, test it:

1. **Open your app**: http://localhost:3000
2. **Login as admin**
3. **Go to Admin Dashboard → Problems**
4. **Click "Add Problem"**
5. **Fill in the form and click "Create Problem"**
6. **Should work without errors!** ✅

---

## What This Migration Does

- Adds a `language` column to the `problems` table
- Sets default value to `'javascript'`
- Adds a constraint to only allow: `javascript`, `python`, `c`, `cpp`, `java`

---

## Why This Happened

The migration file was created but never applied to your Supabase database. This is common when:
- Setting up a project for the first time
- Switching between local and remote databases
- Not running `supabase db push` after creating migrations

---

## Future Prevention

Whenever you create a new migration file, remember to apply it:

```bash
# If using Supabase CLI
supabase db push

# OR manually run the SQL in Supabase Dashboard
```
