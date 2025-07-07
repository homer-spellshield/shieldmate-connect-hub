-- Assign super_admin role to existing user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin' 
FROM auth.users 
WHERE email = 'homerf@spellshield.com.au'
ON CONFLICT (user_id, role) DO NOTHING;