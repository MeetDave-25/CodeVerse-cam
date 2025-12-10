-- Check if users have multiple roles
SELECT 
    p.full_name,
    p.email,
    STRING_AGG(ur.role::text, ', ') as roles
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
GROUP BY p.id, p.full_name, p.email;
