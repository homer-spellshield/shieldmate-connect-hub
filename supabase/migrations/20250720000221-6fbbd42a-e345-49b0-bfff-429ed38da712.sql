-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update the handle_new_user function to work with existing profiles structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  org_id uuid;
  org_name_from_meta TEXT;
  org_domain_from_meta TEXT;
  is_org_invite BOOLEAN;
  invited_org_id UUID;
  invited_role TEXT;
BEGIN
  -- Create a profile for the new user, including their email.
  INSERT INTO public.profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Check if this signup is from an organization invitation
  is_org_invite := (NEW.raw_user_meta_data ->> 'is_org_invite')::BOOLEAN;

  IF is_org_invite THEN
    -- This is an invited user. Add them to the existing organization.
    invited_org_id := (NEW.raw_user_meta_data ->> 'organization_id')::UUID;
    invited_role := NEW.raw_user_meta_data ->> 'role';

    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'organization_owner') ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO public.organization_members (organization_id, user_id, role) VALUES (invited_org_id, NEW.id, invited_role) ON CONFLICT (organization_id, user_id) DO NOTHING;

  ELSE
    -- This is a new organization signup.
    org_name_from_meta := NEW.raw_user_meta_data ->> 'org_name';
    org_domain_from_meta := NEW.raw_user_meta_data ->> 'domain';

    IF org_name_from_meta IS NOT NULL THEN
      -- Check if an organization with this domain already exists.
      SELECT id INTO org_id FROM public.organizations WHERE domain = org_domain_from_meta;

      -- If no organization exists, create one.
      IF org_id IS NULL THEN
        INSERT INTO public.organizations (name, domain, contact_email)
        VALUES (
          org_name_from_meta,
          org_domain_from_meta,
          NEW.email
        )
        RETURNING id INTO org_id;
      END IF;

      -- Assign the 'organization_owner' role in the user_roles table.
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'organization_owner')
      ON CONFLICT (user_id, role) DO NOTHING;

      -- Link the new user to the (either new or existing) organization as an 'owner'.
      INSERT INTO public.organization_members (organization_id, user_id, role)
      VALUES (org_id, NEW.id, 'owner')
      ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;