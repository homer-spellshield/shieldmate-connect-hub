-- supabase/migrations/20250709110000_update_signup_flow.sql

-- Add new columns to the organizations table for domain uniqueness and subscription tracking.
-- Using 'IF NOT EXISTS' makes the script safe to re-run.
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
ADD COLUMN IF NOT EXISTS mission_posts_this_month INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_mission_post_at TIMESTAMPTZ;

-- Add a unique index to the domain to prevent duplicate organization signups from the same company.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_class c
    JOIN   pg_namespace n ON n.oid = c.relnamespace
    WHERE  c.relname = 'organizations_domain_idx'
    AND    n.nspname = 'public'
  ) THEN
    CREATE UNIQUE INDEX organizations_domain_idx ON public.organizations (domain);
  END IF;
END;
$$;


-- This function runs via a trigger after a new user is created in auth.users.
-- It now handles both new organization signups AND users accepting an invitation.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  org_name_from_meta TEXT;
  is_org_invite BOOLEAN;
  invited_org_id UUID;
  invited_role TEXT;
BEGIN
  -- Create a profile for the new user. This happens for all new users.
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

    -- Assign the appropriate role (owner or member)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'organization_owner') -- All org users get this base role for RLS
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Link the user to the organization with the specific role from the invite
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (invited_org_id, NEW.id, invited_role)
    ON CONFLICT (organization_id, user_id) DO NOTHING;

  ELSE
    -- This is a new organization signup.
    org_name_from_meta := NEW.raw_user_meta_data ->> 'org_name';

    IF org_name_from_meta IS NOT NULL THEN
      -- Create the organization record.
      INSERT INTO public.organizations (name, domain, contact_email)
      VALUES (
        org_name_from_meta,
        NEW.raw_user_meta_data ->> 'domain',
        NEW.email
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
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger on the auth.users table is active and uses the updated function.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
