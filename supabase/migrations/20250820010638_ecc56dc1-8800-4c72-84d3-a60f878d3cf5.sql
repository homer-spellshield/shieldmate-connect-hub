-- Fix remaining search_path issues for functions
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_org_id uuid;
  org_name_from_meta TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
  user_email_address TEXT;
BEGIN
  -- Extract user details from metadata or email
  user_first_name := NEW.raw_user_meta_data ->> 'first_name';
  user_last_name := NEW.raw_user_meta_data ->> 'last_name';
  user_email_address := COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email');

  -- Create a profile for the new user.
  INSERT INTO public.profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    user_first_name,
    user_last_name,
    user_email_address
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Check if this is a new organization signup by looking for 'org_name' in metadata.
  org_name_from_meta := NEW.raw_user_meta_data ->> 'org_name';

  IF org_name_from_meta IS NOT NULL THEN
    -- Create the organization record, now including the ABN.
    -- The status will default to 'pending_verification' as set on the table.
    INSERT INTO public.organizations (name, domain, contact_email, abn)
    VALUES (
      org_name_from_meta,
      NEW.raw_user_meta_data ->> 'domain',
      user_email_address,
      NEW.raw_user_meta_data ->> 'abn' -- This line is new
    )
    RETURNING id INTO new_org_id;

    -- Assign the user the 'organization_owner' role.
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'organization_owner')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Link the user to the newly created organization as an 'owner'.
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;