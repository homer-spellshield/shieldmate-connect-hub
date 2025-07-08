-- Set up super admin for homerf@spellshield.com.au
-- First, try to find if user already exists and update their role
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Try to find user by email in auth.users (if they already signed up)
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'homerf@spellshield.com.au';
    
    IF target_user_id IS NOT NULL THEN
        -- User exists, ensure they have super_admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'super_admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Ensure they have a profile
        INSERT INTO public.profiles (user_id, first_name, last_name)
        VALUES (target_user_id, 'Homer', 'F')
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'Super admin role assigned to existing user: homerf@spellshield.com.au';
    ELSE
        RAISE NOTICE 'User homerf@spellshield.com.au not found. They need to sign up first, then this migration can be re-run.';
    END IF;
END $$;