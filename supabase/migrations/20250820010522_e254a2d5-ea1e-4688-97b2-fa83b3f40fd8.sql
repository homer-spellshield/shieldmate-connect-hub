-- Fix security issues identified in scan

-- 1. Fix volunteer skills RLS policy - remove overly permissive policy
DROP POLICY IF EXISTS "Volunteer skills are viewable by organization members for appli" ON public.volunteer_skills;

-- Add more restrictive policy for organization members to view volunteer skills for applications
CREATE POLICY "Org members can view volunteer skills for applications" 
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
  )
);

-- 2. Fix function search_path issues - update existing functions
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

-- 3. Create new RPC functions for team management
CREATE OR REPLACE FUNCTION public.update_team_member_role(p_org_id uuid, p_member_id uuid, p_new_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the caller is an owner of the organization
  IF NOT public.is_organization_owner(p_org_id) THEN
    RAISE EXCEPTION 'You do not have permission to manage team members.';
  END IF;
  
  -- Prevent removing the last owner
  IF p_new_role != 'owner' THEN
    IF (SELECT COUNT(*) FROM public.organization_members WHERE organization_id = p_org_id AND role = 'owner') <= 1 THEN
      IF (SELECT role FROM public.organization_members WHERE id = p_member_id) = 'owner' THEN
        RAISE EXCEPTION 'Cannot change role of the last owner.';
      END IF;
    END IF;
  END IF;
  
  -- Update the member's role
  UPDATE public.organization_members 
  SET role = p_new_role 
  WHERE id = p_member_id AND organization_id = p_org_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team member not found or you do not have permission to update this member.';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.remove_team_member(p_org_id uuid, p_member_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  member_role text;
BEGIN
  -- Check if the caller is an owner of the organization
  IF NOT public.is_organization_owner(p_org_id) THEN
    RAISE EXCEPTION 'You do not have permission to manage team members.';
  END IF;
  
  -- Get the member's role
  SELECT role INTO member_role 
  FROM public.organization_members 
  WHERE id = p_member_id AND organization_id = p_org_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team member not found.';
  END IF;
  
  -- Prevent removing the last owner
  IF member_role = 'owner' THEN
    IF (SELECT COUNT(*) FROM public.organization_members WHERE organization_id = p_org_id AND role = 'owner') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last owner from the organization.';
    END IF;
  END IF;
  
  -- Remove the member
  DELETE FROM public.organization_members 
  WHERE id = p_member_id AND organization_id = p_org_id;
END;
$function$;