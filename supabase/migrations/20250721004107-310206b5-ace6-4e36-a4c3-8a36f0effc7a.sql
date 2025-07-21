-- This migration adds the missing foreign key constraint to the mission_applications table.
-- This allows Supabase to correctly join the volunteer's profile information when fetching applications.

ALTER TABLE public.mission_applications
ADD CONSTRAINT mission_applications_volunteer_id_fkey
FOREIGN KEY (volunteer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Additionally, let's add a foreign key to the missions table to ensure data integrity.
ALTER TABLE public.mission_applications
ADD CONSTRAINT mission_applications_mission_id_fkey
FOREIGN KEY (mission_id) REFERENCES public.missions(id) ON DELETE CASCADE;