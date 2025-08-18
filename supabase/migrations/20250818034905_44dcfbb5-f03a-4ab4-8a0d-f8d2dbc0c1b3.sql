-- Harden profiles table RLS and add mission-scoped profile fetch RPC

-- Ensure RLS is enabled (should already be)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive policy if it exists
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Allow users to view their own profile only
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Allow organization members to view applicant profiles for missions they own
CREATE POLICY "Org members can view applicant profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.mission_applications ma
    JOIN public.missions m ON m.id = ma.mission_id
    JOIN public.organization_members om ON om.organization_id = m.organization_id
    WHERE ma.volunteer_id = profiles.user_id
      AND om.user_id = auth.uid()
  )
);

-- Allow mission participants to view other participants' profiles via messages
CREATE POLICY "Mission participants can view profiles via messages"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.mission_messages mm
    WHERE mm.user_id = profiles.user_id
      AND public.is_mission_participant(mm.mission_id, auth.uid())
  )
);

-- Allow mission participants to view other participants' profiles via files
CREATE POLICY "Mission participants can view profiles via files"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.mission_files mf
    WHERE mf.user_id = profiles.user_id
      AND public.is_mission_participant(mf.mission_id, auth.uid())
  )
);

-- Allow mission participants to view rater profiles via ratings
CREATE POLICY "Mission participants can view profiles via ratings"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.mission_ratings mr
    WHERE mr.rater_user_id = profiles.user_id
      AND public.is_mission_participant(mr.mission_id, auth.uid())
  )
);

-- RPC to safely fetch profile within mission context (limits exposure)
CREATE OR REPLACE FUNCTION public.get_profile_for_mission(
  p_mission_id uuid,
  p_user_id uuid
)
RETURNS TABLE(user_id uuid, first_name text, last_name text, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pr.user_id, pr.first_name, pr.last_name, pr.email
  FROM public.profiles pr
  WHERE pr.user_id = p_user_id
    AND public.is_mission_participant(p_mission_id, auth.uid());
$$;