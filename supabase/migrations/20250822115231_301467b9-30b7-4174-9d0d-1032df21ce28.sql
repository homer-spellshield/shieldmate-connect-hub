-- Fix security vulnerabilities by tightening RLS policies

-- 1. Fix profiles table - remove overly broad access policies and restrict to necessary relationships only
DROP POLICY IF EXISTS "Org members can view applicant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Mission participants can view profiles via messages" ON public.profiles;
DROP POLICY IF EXISTS "Mission participants can view profiles via files" ON public.profiles;
DROP POLICY IF EXISTS "Mission participants can view profiles via ratings" ON public.profiles;

-- Replace with more restrictive policies
CREATE POLICY "Organization members can view accepted volunteer profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM mission_applications ma
    JOIN missions m ON m.id = ma.mission_id
    JOIN organization_members om ON om.organization_id = m.organization_id
    WHERE ma.volunteer_id = profiles.user_id 
      AND om.user_id = auth.uid()
      AND ma.status = 'accepted'
  )
);

CREATE POLICY "Mission participants can view each other's basic profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM mission_applications ma1
    JOIN mission_applications ma2 ON ma1.mission_id = ma2.mission_id
    WHERE ma1.volunteer_id = profiles.user_id 
      AND ma2.volunteer_id = auth.uid()
      AND ma1.status = 'accepted'
      AND ma2.status = 'accepted'
  )
);

-- 2. Fix organizations table - restrict to members and mission participants only
DROP POLICY IF EXISTS "Applicants can view organizations they applied to" ON public.organizations;

CREATE POLICY "Mission applicants can view organization name only" 
ON public.organizations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM missions m
    JOIN mission_applications ma ON ma.mission_id = m.id
    WHERE m.organization_id = organizations.id 
      AND ma.volunteer_id = auth.uid()
  )
);

-- 3. Fix missions table - restrict to organization members and accepted volunteers only
DROP POLICY IF EXISTS "Authenticated users can view missions" ON public.missions;

CREATE POLICY "Organization members can view their missions" 
ON public.missions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.organization_id = missions.organization_id 
      AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Accepted volunteers can view their missions" 
ON public.missions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM mission_applications ma
    WHERE ma.mission_id = missions.id 
      AND ma.volunteer_id = auth.uid()
      AND ma.status = 'accepted'
  )
);

CREATE POLICY "Public can view open missions for discovery" 
ON public.missions 
FOR SELECT 
USING (
  status = 'open' AND 
  EXISTS (
    SELECT 1 
    FROM organizations o 
    WHERE o.id = missions.organization_id 
      AND o.status = 'approved'
  )
);

-- 4. Fix volunteer_skills table - restrict to mission context only
DROP POLICY IF EXISTS "Org members can view volunteer skills for applications" ON public.volunteer_skills;

CREATE POLICY "Organization members can view skills of accepted volunteers only" 
ON public.volunteer_skills 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM mission_applications ma
    JOIN missions m ON m.id = ma.mission_id
    JOIN organization_members om ON om.organization_id = m.organization_id
    WHERE ma.volunteer_id = volunteer_skills.volunteer_id 
      AND om.user_id = auth.uid()
      AND ma.status = 'accepted'
  )
);