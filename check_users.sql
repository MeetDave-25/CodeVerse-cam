-- Check all users in the database
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.total_score,
    p.problems_solved,
    ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
ORDER BY p.total_score DESC;

-- Check if there are multiple users
SELECT COUNT(*) as total_users FROM public.profiles;

-- Check student users only
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.total_score,
    ur.role
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.role = 'student'
ORDER BY p.total_score DESC;
