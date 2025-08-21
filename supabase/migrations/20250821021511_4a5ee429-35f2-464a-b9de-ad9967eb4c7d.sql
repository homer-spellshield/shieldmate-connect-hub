-- Fix all remaining functions to have proper search_path
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

CREATE OR REPLACE FUNCTION public.get_team_members(org_id uuid)
 RETURNS TABLE(id uuid, role text, user_id uuid, first_name text, last_name text, email text, avatar_url text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    om.id,
    om.role,
    om.user_id,
    p.first_name,
    p.last_name,
    u.email,
    p.avatar_url
  FROM
    public.organization_members om
  JOIN
    public.profiles p ON om.user_id = p.user_id
  JOIN
    auth.users u ON om.user_id = u.id
  WHERE
    om.organization_id = org_id;
$function$;

CREATE OR REPLACE FUNCTION public.set_volunteer_skills_atomic(p_volunteer_id uuid, p_skill_ids uuid[], p_admin_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete existing skills for the volunteer
  DELETE FROM public.volunteer_skills WHERE volunteer_id = p_volunteer_id;

  -- Insert new skills if the array is not empty
  IF array_length(p_skill_ids, 1) > 0 THEN
    INSERT INTO public.volunteer_skills (volunteer_id, skill_id, assigned_by)
    SELECT p_volunteer_id, unnest(p_skill_ids), p_admin_id;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_mission_closure_sql()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update missions that have been in pending_closure for more than 3 days
  UPDATE missions 
  SET 
    status = 'completed',
    closed_at = NOW()
  WHERE 
    status = 'pending_closure' 
    AND closure_initiated_at < NOW() - INTERVAL '3 days'
    AND closed_at IS NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_volunteers_with_details()
 RETURNS TABLE(id uuid, email text, first_name text, last_name text, bio text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- This query can only be run by users with the 'super_admin' role
  IF NOT has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'You do not have permission to view this data.';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id::uuid as id,
    u.email::text,
    p.first_name::text,
    p.last_name::text,
    p.bio::text,
    p.created_at::timestamptz
  FROM
    public.profiles p
  JOIN
    auth.users u ON p.user_id = u.id
  JOIN
    public.user_roles ur ON p.user_id = ur.user_id
  WHERE
    ur.role = 'volunteer';
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_team_invitation(p_email text, p_role text, p_organization_id uuid, p_inviter_user_id uuid)
 RETURNS TABLE(outcome text, user_id uuid, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_already_member boolean;
BEGIN
  -- Ensure inviter is an owner of the organization
  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_organization_id
      AND om.user_id = p_inviter_user_id
      AND om.role = 'owner'
  ) THEN
    RAISE EXCEPTION 'You do not have permission to invite members to this organization.';
  END IF;

  -- Lookup user by email in auth.users (allowed in SECURITY DEFINER)
  SELECT u.id
  INTO v_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(p_email)
  LIMIT 1;

  -- If user does not exist, instruct caller to send invitation
  IF v_user_id IS NULL THEN
    outcome := 'send_invite';
    user_id := NULL;
    message := 'User does not exist; send invitation email.';
    RETURN NEXT;
    RETURN;
  END IF;

  -- If user exists, check if they are already a member
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_organization_id
      AND om.user_id = v_user_id
  ) INTO v_already_member;

  IF v_already_member THEN
    outcome := 'already_member';
    user_id := v_user_id;
    message := 'User is already a member of the organization.';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Add existing user to organization with provided role (default to "member")
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (p_organization_id, v_user_id, COALESCE(NULLIF(trim(p_role), ''), 'member'));

  outcome := 'added_existing_user';
  user_id := v_user_id;
  message := 'Existing user added to organization.';
  RETURN NEXT;
  RETURN;
END;
$function$;