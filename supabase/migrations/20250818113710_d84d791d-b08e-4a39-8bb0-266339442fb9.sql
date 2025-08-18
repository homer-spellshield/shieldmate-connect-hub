-- Restrict public access to organizations and add safe RPCs

-- 1) Remove overly permissive public SELECT policy
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON public.organizations;

-- 2) Add granular, least-privilege SELECT policies
-- Members of an organization can view their organization
CREATE POLICY "Org members can view their organization"
ON public.organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organizations.id AND om.user_id = auth.uid()
  )
);

-- Super admins can view all organizations
CREATE POLICY "Super admins can view all organizations"
ON public.organizations
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Mission participants can view the organization for their missions
CREATE POLICY "Mission participants can view organizations"
ON public.organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.missions m
    WHERE m.organization_id = organizations.id
      AND public.is_mission_participant(m.id, auth.uid())
  )
);

-- Applicants can view organizations of missions they applied to
CREATE POLICY "Applicants can view organizations they applied to"
ON public.organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.missions m
    JOIN public.mission_applications ma ON ma.mission_id = m.id
    WHERE m.organization_id = organizations.id
      AND ma.volunteer_id = auth.uid()
  )
);

-- 3) Safe, public-facing RPC that exposes only non-sensitive org fields alongside missions
CREATE OR REPLACE FUNCTION public.get_open_missions_public(p_limit int DEFAULT NULL)
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
  template_title text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
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
    t.title AS template_title
  FROM public.missions m
  JOIN public.organizations o ON o.id = m.organization_id
  JOIN public.mission_templates t ON t.id = m.template_id
  WHERE m.status = 'open' AND o.status = 'approved'
  ORDER BY m.created_at DESC
  LIMIT COALESCE(p_limit, 2147483647)
$func$;

-- 4) Safe domain existence check for signup (avoids exposing org rows)
CREATE OR REPLACE FUNCTION public.organization_domain_exists(p_domain text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations WHERE domain = p_domain
  )
$func$;