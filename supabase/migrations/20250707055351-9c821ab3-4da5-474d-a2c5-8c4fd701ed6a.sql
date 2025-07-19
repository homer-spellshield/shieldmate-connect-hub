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

-- Super admin user creation intentionally removed for security.
-- Create super admin manually through Supabase dashboard:
-- 1. Go to Authentication -> Users -> Create user
-- 2. Then go to Table Editor -> user_roles -> Insert row with role "super_admin"

SELECT 'Super admin creation removed for security - create manually via dashboard.';