-- Fix the handle_new_user function to have proper search_path
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