-- This migration fixes the relationship between organization_members and profiles.

-- We need to add a foreign key from organization_members.user_id to profiles.user_id
-- to allow Supabase to join them correctly.

-- First, ensure the user_id in organization_members references auth.users
ALTER TABLE public.organization_members
DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey,
ADD CONSTRAINT organization_members_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Now, add a foreign key from profiles.user_id to auth.users if it doesn't exist
-- This is often the missing link.
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey,
ADD CONSTRAINT profiles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- With both tables properly linked to auth.users, Supabase's auto-linking
-- for queries should now work correctly, resolving the TypeScript error.

SELECT 'Database relationships for team members fixed.';