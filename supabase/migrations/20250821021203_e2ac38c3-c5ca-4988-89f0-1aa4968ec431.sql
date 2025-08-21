-- Fix remaining functions to have proper search_path
CREATE OR REPLACE FUNCTION public.get_open_missions_public(p_limit integer DEFAULT NULL::integer)
 RETURNS TABLE(id uuid, title text, description text, estimated_hours integer, difficulty_level text, status text, template_id uuid, organization_id uuid, organization_name text, template_title text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.organization_domain_exists(p_domain text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations WHERE domain = p_domain
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_profile_for_mission(p_mission_id uuid, p_user_id uuid)
 RETURNS TABLE(user_id uuid, first_name text, last_name text, email text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT pr.user_id, pr.first_name, pr.last_name, pr.email
  FROM public.profiles pr
  WHERE pr.user_id = p_user_id
    AND public.is_mission_participant(p_mission_id, auth.uid());
$function$;

CREATE OR REPLACE FUNCTION public.get_user_organizations()
 RETURNS TABLE(organization_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT om.organization_id 
  FROM organization_members om 
  WHERE om.user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.is_organization_owner(org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members om 
    WHERE om.user_id = auth.uid() 
      AND om.organization_id = org_id 
      AND om.role = 'owner'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_mission_participant(_mission_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    -- Check if user is an accepted volunteer for the mission
    SELECT 1 FROM public.mission_applications
    WHERE mission_id = _mission_id AND volunteer_id = _user_id AND status = 'accepted'
    UNION ALL
    -- Check if user is a member of the organization that owns the mission
    SELECT 1 FROM public.missions m
    JOIN public.organization_members om ON m.organization_id = om.organization_id
    WHERE m.id = _mission_id AND om.user_id = _user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$function$;