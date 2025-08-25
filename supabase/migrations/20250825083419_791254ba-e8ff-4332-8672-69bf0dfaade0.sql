-- 1) Break RLS recursion on missions by avoiding direct reference to mission_applications in policy
-- Create a SECURITY DEFINER helper that fetches mission ids the current user applied to
CREATE OR REPLACE FUNCTION public.user_applied_mission_ids()
RETURNS TABLE(mission_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ma.mission_id
  FROM public.mission_applications ma
  WHERE ma.volunteer_id = auth.uid();
$$;

-- 2) Recreate the policy using the helper function (no recursion)
DROP POLICY IF EXISTS "Volunteers can view missions they applied to" ON public.missions;

CREATE POLICY "Volunteers can view missions they applied to"
ON public.missions
FOR SELECT
USING (
  id IN (SELECT mission_id FROM public.user_applied_mission_ids())
);
