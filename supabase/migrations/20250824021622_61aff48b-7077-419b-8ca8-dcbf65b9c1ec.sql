-- First drop the existing function to allow changing return type
DROP FUNCTION IF EXISTS public.get_volunteer_missions();

-- Drop all existing problematic RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "Volunteers can view open missions from approved orgs" ON public.missions;
DROP POLICY IF EXISTS "Volunteers can view missions they are accepted for" ON public.missions;
DROP POLICY IF EXISTS "Organization members can view their missions" ON public.missions;
DROP POLICY IF EXISTS "Anyone can view open missions" ON public.missions;
DROP POLICY IF EXISTS "Organization members can view applications for their missions" ON public.mission_applications;
DROP POLICY IF EXISTS "Volunteers can view their own applications" ON public.mission_applications;

-- Create security definer functions to handle complex permission checks without triggering RLS recursion

-- Function to check if a user is a volunteer for a specific mission
CREATE OR REPLACE FUNCTION public.is_volunteer_for_mission(p_mission_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mission_applications
    WHERE mission_id = p_mission_id 
    AND volunteer_id = p_user_id 
    AND status = 'accepted'
  );
$$;

-- Function to get organization missions with application counts
CREATE OR REPLACE FUNCTION public.get_organization_missions_with_applications(p_org_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  status text,
  estimated_hours integer,
  difficulty_level text,
  created_at timestamptz,
  application_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is a member of the organization
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = p_org_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    m.id,
    m.title,
    m.description,
    m.status,
    m.estimated_hours,
    m.difficulty_level,
    m.created_at,
    COUNT(ma.id) as application_count
  FROM public.missions m
  LEFT JOIN public.mission_applications ma ON ma.mission_id = m.id
  WHERE m.organization_id = p_org_id
  GROUP BY m.id, m.title, m.description, m.status, m.estimated_hours, m.difficulty_level, m.created_at
  ORDER BY m.created_at DESC;
END;
$$;

-- Function to get volunteer applications with mission details
CREATE OR REPLACE FUNCTION public.get_volunteer_applications_with_details(p_volunteer_id uuid)
RETURNS TABLE(
  id uuid,
  status text,
  application_message text,
  applied_at timestamptz,
  mission_id uuid,
  mission_title text,
  mission_description text,
  organization_id uuid,
  organization_name text,
  estimated_hours integer,
  difficulty_level text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if the requesting user is the volunteer
  IF auth.uid() != p_volunteer_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    ma.id,
    ma.status,
    ma.application_message,
    ma.applied_at,
    m.id as mission_id,
    m.title as mission_title,
    m.description as mission_description,
    o.id as organization_id,
    o.name as organization_name,
    m.estimated_hours,
    m.difficulty_level
  FROM public.mission_applications ma
  JOIN public.missions m ON m.id = ma.mission_id
  JOIN public.organizations o ON o.id = m.organization_id
  WHERE ma.volunteer_id = p_volunteer_id
  ORDER BY ma.applied_at DESC;
END;
$$;

-- Function to check if user is organization member
CREATE OR REPLACE FUNCTION public.is_organization_member(p_org_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id 
    AND user_id = p_user_id
  );
$$;

-- Now create simplified, non-recursive RLS policies

-- Missions policies (simplified to avoid recursion)
CREATE POLICY "Public can view open missions from approved orgs"
ON public.missions FOR SELECT
USING (
  status = 'open' AND 
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE status = 'approved'
  )
);

CREATE POLICY "Organization members can view their org missions"
ON public.missions FOR SELECT
USING (
  is_organization_member(organization_id, auth.uid())
);

CREATE POLICY "Volunteers can view missions they applied to"
ON public.missions FOR SELECT
USING (
  id IN (
    SELECT mission_id FROM public.mission_applications 
    WHERE volunteer_id = auth.uid()
  )
);

-- Mission applications policies (simplified)
CREATE POLICY "Volunteers view own applications"
ON public.mission_applications FOR SELECT
USING (volunteer_id = auth.uid());

CREATE POLICY "Org members view applications for their missions"
ON public.mission_applications FOR SELECT
USING (
  mission_id IN (
    SELECT id FROM public.missions 
    WHERE is_organization_member(organization_id, auth.uid())
  )
);

-- Create the get_volunteer_missions function with updated return type
CREATE OR REPLACE FUNCTION public.get_volunteer_missions()
RETURNS TABLE(
  id uuid, 
  title text, 
  description text, 
  status text, 
  organization_id uuid, 
  organization_name text,
  estimated_hours integer, 
  difficulty_level text
)
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.title,
    m.description,
    m.status,
    m.organization_id,
    o.name as organization_name,
    m.estimated_hours,
    m.difficulty_level
  FROM public.missions m
  INNER JOIN public.mission_applications ma ON m.id = ma.mission_id
  INNER JOIN public.organizations o ON o.id = m.organization_id
  WHERE ma.volunteer_id = auth.uid() 
  AND ma.status = 'accepted';
END;
$$;

-- Drop and recreate get_open_missions_public with updated return type
DROP FUNCTION IF EXISTS public.get_open_missions_public(integer);

CREATE OR REPLACE FUNCTION public.get_open_missions_public(p_limit integer DEFAULT NULL)
RETURNS TABLE(
  id uuid, 
  title text, 
  description text, 
  estimated_hours integer, 
  difficulty_level text, 
  status text, 
  template_id uuid, 
  organization_id uuid, 
  organization_name text, 
  template_title text,
  created_at timestamptz
)
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    m.id,
    m.title,
    m.description,
    m.estimated_hours,
    m.difficulty_level,
    m.status,
    m.template_id,
    m.organization_id,
    o.name AS organization_name,
    t.title AS template_title,
    m.created_at
  FROM public.missions m
  JOIN public.organizations o ON o.id = m.organization_id
  LEFT JOIN public.mission_templates t ON t.id = m.template_id
  WHERE m.status = 'open' AND o.status = 'approved'
  ORDER BY m.created_at DESC
  LIMIT COALESCE(p_limit, 2147483647)
$$;