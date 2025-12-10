# Supabase Database Recovery Guide

## Step 1: Create New Supabase Project (2 minutes)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard

2. **Click "New Project"**
   - Organization: Select your organization
   - Name: `logic-ladder-pro-new` (or any name you prefer)
   - Database Password: **SAVE THIS PASSWORD!** (You'll need it)
   - Region: Choose closest to you (e.g., Southeast Asia)
   - Click "Create new project"

3. **Wait for project to initialize** (about 1-2 minutes)
   - You'll see a progress indicator
   - Wait until it shows "Project is ready"

---

## Step 2: Get New Project Credentials

1. **Go to Project Settings:**
   - Click on "Settings" (gear icon) in the left sidebar
   - Click "API" under Project Settings

2. **Copy these values:**
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Project ID**: The part before `.supabase.co` (e.g., `abcdefgh`)
   - **anon/public key**: Long string starting with `eyJ...`

3. **Keep this tab open** - you'll need these values

---

## Step 3: Update Your .env File

Open `d:\backup\logic-ladder-pro\.env` and replace with:

```env
VITE_SUPABASE_PROJECT_ID="YOUR_NEW_PROJECT_ID"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_NEW_ANON_KEY"
VITE_SUPABASE_URL="YOUR_NEW_PROJECT_URL"

# Piston API Configuration (No Docker or Authentication Required!)
# Public API with 5 requests/second rate limit
VITE_PISTON_API_URL="https://emkc.org/api/v2/piston"
```

**Replace:**
- `YOUR_NEW_PROJECT_ID` with the project ID you copied
- `YOUR_NEW_ANON_KEY` with the anon/public key
- `YOUR_NEW_PROJECT_URL` with the project URL

---

## Step 4: Apply Database Migrations

1. **Go to SQL Editor in Supabase:**
   - In your new project dashboard
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

2. **Run Migration 1 - Main Schema:**

Copy and paste this entire SQL script:

```sql
-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  college_year INTEGER CHECK (college_year BETWEEN 1 AND 3),
  avatar_url TEXT,
  total_score INTEGER DEFAULT 0,
  problems_solved INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problems table
CREATE TABLE public.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points INTEGER DEFAULT 10,
  year INTEGER CHECK (year BETWEEN 1 AND 3),
  semester INTEGER CHECK (semester BETWEEN 1 AND 6),
  subject TEXT NOT NULL,
  test_cases JSONB,
  starter_code TEXT,
  is_daily BOOLEAN DEFAULT FALSE,
  daily_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language TEXT DEFAULT 'javascript',
  status TEXT CHECK (status IN ('pending', 'accepted', 'wrong_answer', 'error', 'timeout')),
  test_results JSONB,
  score INTEGER DEFAULT 0,
  time_taken INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  criteria JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges junction table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- User roles table
CREATE TYPE public.app_role AS ENUM ('student', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role DEFAULT 'student',
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for problems
CREATE POLICY "Anyone can view problems" ON public.problems FOR SELECT USING (true);
CREATE POLICY "Admins can insert problems" ON public.problems FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update problems" ON public.problems FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete problems" ON public.problems FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for submissions
CREATE POLICY "Users can view own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own submissions" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all submissions" ON public.submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for badges
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);

-- RLS Policies for user_badges
CREATE POLICY "Users can view all user badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System can insert user badges" ON public.user_badges FOR INSERT WITH CHECK (true);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON public.problems
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample badges
INSERT INTO public.badges (name, description, icon, criteria) VALUES
  ('First Steps', 'Solve your first problem', '🎯', '{"problems_solved": 1}'),
  ('Problem Solver', 'Solve 10 problems', '🌟', '{"problems_solved": 10}'),
  ('Code Master', 'Solve 50 problems', '🏆', '{"problems_solved": 50}'),
  ('Streak Warrior', 'Maintain a 7-day streak', '🔥', '{"streak": 7}'),
  ('Speed Demon', 'Solve a problem in under 5 minutes', '⚡', '{"time_under": 300}');
```

Click **"Run"** and wait for "Success" message.

3. **Run Migration 2 - Add Language Column:**

Create a new query and run:

```sql
-- Add language column to problems table
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'javascript';

-- Add constraint
ALTER TABLE public.problems DROP CONSTRAINT IF EXISTS problems_language_check;
ALTER TABLE public.problems ADD CONSTRAINT problems_language_check 
CHECK (language IN ('javascript', 'python', 'c', 'cpp', 'java'));
```

Click **"Run"** and wait for "Success" message.

---

## Step 5: Create Admin User

1. **Sign up for a new account:**
   - Go to your app: http://localhost:3000
   - Click "Sign Up"
   - Create an account with your email

2. **Make yourself admin:**
   - Go back to Supabase SQL Editor
   - Run this (replace with your email):

```sql
-- Make user admin (replace 'your@email.com' with your actual email)
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'your@email.com'
);
```

---

## Step 6: Restart Dev Server

```bash
# Stop the current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

---

## Step 7: Test Everything

1. **Login to your app**
2. **Go to Admin Dashboard**
3. **Try creating a problem**
4. **Should work perfectly!** ✅

---

## What You Lost vs What You Kept

**✅ KEPT (100% intact):**
- All code
- All migrations
- All application logic
- Piston API integration
- Rate limiting system

**❌ LOST (if any):**
- Test data (problems you created)
- Test user accounts
- Submissions

**You can recreate test data easily once the system is running!**

---

## Summary

This recovery takes about **5-10 minutes** and gets you fully operational. Your application code is completely intact, we're just recreating the database structure.

Follow each step carefully and you'll be back online! 🚀
