-- Check status of the admin user
-- Replace 'admin@example.com' with the email you tried to use

SELECT 
    u.id as auth_id, 
    u.email, 
    u.created_at,
    p.full_name as profile_name,
    ur.role as user_role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@example.com';
