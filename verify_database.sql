-- Run this in Supabase SQL Editor to verify your database setup

-- Check if all tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('profiles', 'problems', 'submissions', 'badges', 'user_badges', 'user_roles') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'problems', 'submissions', 'badges', 'user_badges', 'user_roles')
ORDER BY table_name;

-- Check columns in problems table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'problems'
ORDER BY ordinal_position;

-- Check if language column exists in problems table
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'problems' 
            AND column_name = 'language'
        ) 
        THEN '✅ language column EXISTS'
        ELSE '❌ language column MISSING - Need to add it!'
    END as language_column_status;

-- Check RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
