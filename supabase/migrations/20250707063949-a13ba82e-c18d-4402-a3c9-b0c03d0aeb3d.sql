-- Insert the super admin user directly (this approach bypasses the auth.users conflict issue)
-- First, let's create the auth user record
WITH new_user AS (
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'homerf@spellshield.com.au',
    crypt('9tZHY!ChXD5X7^b6eMPh', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Homer", "last_name": "Frias"}',
    false,
    'authenticated'
  )
  RETURNING id, email
)
-- Now create the profile and assign the super_admin role
INSERT INTO public.profiles (user_id, first_name, last_name)
SELECT id, 'Homer', 'Frias' FROM new_user;

-- Assign super_admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin' FROM (
  SELECT id FROM auth.users WHERE email = 'homerf@spellshield.com.au'
) AS admin_user;