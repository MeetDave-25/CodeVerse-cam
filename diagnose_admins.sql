-- Diagnose "Admin User" entries in the leaderboard
-- This will list everyone in the profiles table and their associated roles

SELECT 
    p.id as profile_id,
    p.email as profile_email,
    p.full_name,
    p.total_score,
    u.id as auth_id,
    u.email as auth_email,
    COUNT(ur.role) as role_count,
    STRING_AGG(ur.role::text, ', ') as roles
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
GROUP BY p.id, p.email, p.full_name, p.total_score, u.id, u.email
ORDER BY p.full_name;

-- Specific check for users named "Admin User"
SELECT * FROM public.profiles WHERE full_name ILIKE '%Admin%';
