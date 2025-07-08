-- Create super admin user directly in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'homerf@spellshield.com.au',
  crypt('9tZHY!ChXD5X7^b6eMPh', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Homer","last_name":"F"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Get the user ID and create profile and role
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'homerf@spellshield.com.au';
    
    -- Create profile
    INSERT INTO public.profiles (user_id, first_name, last_name)
    VALUES (target_user_id, 'Homer', 'F')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Assign super admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
END $$;