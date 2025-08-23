-- Fix critical authentication issues

-- 1. Remove problematic RLS policy that causes infinite recursion
DROP POLICY IF EXISTS "Mission participants can view organizations" ON public.organizations;

-- 2. Remove other potentially problematic policies that reference is_mission_participant
DROP POLICY IF EXISTS "Mission applicants can view organization name only" ON public.organizations;

-- 3. Add simpler, safer policies for organization access
CREATE POLICY "Open missions show basic org info" ON public.organizations
FOR SELECT 
USING (
  -- Allow viewing basic org info for missions that are open
  EXISTS (
    SELECT 1 FROM public.missions m 
    WHERE m.organization_id = organizations.id 
    AND m.status = 'open'
  )
);

-- 4. Policy for mission applicants to see organization name
CREATE POLICY "Mission applicants can view basic org info" ON public.organizations  
FOR SELECT
USING (
  -- Users who have applied to missions can see basic org info
  EXISTS (
    SELECT 1 FROM public.mission_applications ma
    JOIN public.missions m ON ma.mission_id = m.id
    WHERE m.organization_id = organizations.id 
    AND ma.volunteer_id = auth.uid()
  )
);