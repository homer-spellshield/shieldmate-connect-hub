-- Fix infinite recursion in RLS policies by removing circular dependencies

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Accepted volunteers can view their missions" ON public.missions;

-- Create a simpler policy for volunteers to view missions they're accepted for
-- This uses a direct check without circular reference
CREATE POLICY "Volunteers can view missions they are accepted for" 
ON public.missions 
FOR SELECT 
USING (
  id IN (
    SELECT mission_id 
    FROM public.mission_applications 
    WHERE volunteer_id = auth.uid() 
    AND status = 'accepted'
  )
);

-- Ensure profiles table has proper update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add a policy for volunteers to view open missions from approved organizations
CREATE POLICY "Volunteers can view open missions from approved orgs" 
ON public.missions 
FOR SELECT 
USING (
  status = 'open' 
  AND organization_id IN (
    SELECT id FROM public.organizations 
    WHERE status = 'approved'
  )
);

-- Ensure mission_applications policies don't cause recursion
-- These policies look safe but let's recreate them to be sure
DROP POLICY IF EXISTS "Volunteers can view their own applications" ON public.mission_applications;
DROP POLICY IF EXISTS "Volunteers can create applications" ON public.mission_applications;

CREATE POLICY "Volunteers can view their own applications" 
ON public.mission_applications 
FOR SELECT 
USING (volunteer_id = auth.uid());

CREATE POLICY "Volunteers can create applications" 
ON public.mission_applications 
FOR INSERT 
WITH CHECK (volunteer_id = auth.uid() AND status = 'pending');

-- Create a function to safely get user's missions without recursion
CREATE OR REPLACE FUNCTION public.get_volunteer_missions()
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  status text,
  organization_id uuid,
  estimated_hours integer,
  difficulty_level text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    m.id,
    m.title,
    m.description,
    m.status,
    m.organization_id,
    m.estimated_hours,
    m.difficulty_level
  FROM public.missions m
  INNER JOIN public.mission_applications ma ON m.id = ma.mission_id
  WHERE ma.volunteer_id = auth.uid() 
  AND ma.status = 'accepted';
$function$;