-- Add volunteer fields to profiles table (without defaults to avoid casting issues)
ALTER TABLE public.profiles 
ADD COLUMN availability TEXT,
ADD COLUMN status TEXT,
ADD COLUMN experience_level TEXT,
ADD COLUMN join_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN time_zone TEXT;

-- Create enum types for better data integrity
CREATE TYPE public.volunteer_status AS ENUM ('active', 'inactive', 'on_break');
CREATE TYPE public.experience_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE public.availability_type AS ENUM ('full_time', 'part_time', 'weekends', 'flexible');

-- Update the columns to use the enums
ALTER TABLE public.profiles 
ALTER COLUMN status TYPE volunteer_status USING COALESCE(status::volunteer_status, 'active'::volunteer_status),
ALTER COLUMN experience_level TYPE experience_level USING experience_level::experience_level,
ALTER COLUMN availability TYPE availability_type USING availability::availability_type;

-- Set defaults after converting to enum types
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'active'::volunteer_status;

-- Create first Super Admin user
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
) ON CONFLICT (email) DO NOTHING;

-- Get the user ID and create profile + super_admin role
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'homerf@spellshield.com.au';
    
    IF admin_user_id IS NOT NULL THEN
        -- Create profile
        INSERT INTO public.profiles (user_id, first_name, last_name)
        VALUES (admin_user_id, 'Homer', 'Frias')
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Assign super_admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'super_admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;