-- Reset database by dropping all custom tables and recreating the schema

-- Drop existing tables (in correct dependency order)
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.skills CASCADE;
DROP TABLE IF EXISTS public.mission_templates CASCADE;

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(_user_id uuid, _role app_role) CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.availability_type CASCADE;
DROP TYPE IF EXISTS public.experience_level CASCADE;
DROP TYPE IF EXISTS public.volunteer_status CASCADE;

-- Recreate all types
CREATE TYPE public.app_role AS ENUM ('super_admin', 'organization_owner', 'team_member', 'volunteer');
CREATE TYPE public.availability_type AS ENUM ('full_time', 'part_time', 'weekends', 'flexible');
CREATE TYPE public.experience_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE public.volunteer_status AS ENUM ('active', 'inactive', 'on_break');

-- Recreate profiles table
CREATE TABLE public.profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    first_name text,
    last_name text,
    avatar_url text,
    bio text,
    time_zone text,
    availability availability_type,
    experience_level experience_level,
    status volunteer_status DEFAULT 'active',
    level integer DEFAULT 1,
    xp_points integer DEFAULT 0,
    join_date timestamptz DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Recreate organizations table
CREATE TABLE public.organizations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    logo_url text,
    website_url text,
    contact_email text,
    domain text,
    subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
    mission_posts_this_month integer NOT NULL DEFAULT 0,
    last_mission_post_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Recreate user_roles table
CREATE TABLE public.user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Recreate organization_members table
CREATE TABLE public.organization_members (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

-- Recreate skills table
CREATE TABLE public.skills (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    category text,
    description text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Recreate mission_templates table
CREATE TABLE public.mission_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    difficulty_level text,
    estimated_hours integer,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create unique index for organization domain
CREATE UNIQUE INDEX organizations_domain_idx ON public.organizations (domain);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_templates ENABLE ROW LEVEL SECURITY;

-- Recreate functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  org_name_from_meta TEXT;
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Check if it's an organization signup
  org_name_from_meta := NEW.raw_user_meta_data ->> 'org_name';

  IF org_name_from_meta IS NOT NULL THEN
    -- Create the organization record
    INSERT INTO public.organizations (name, domain, contact_email)
    VALUES (
      org_name_from_meta,
      NEW.raw_user_meta_data ->> 'domain',
      NEW.email
    )
    RETURNING id INTO new_org_id;

    -- Assign the user the 'organization_owner' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'organization_owner')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Link the user to the organization as an 'owner'
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mission_templates_updated_at
    BEFORE UPDATE ON public.mission_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for organizations
CREATE POLICY "Organizations are viewable by everyone" ON public.organizations
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Organization owners can update their org" ON public.organizations
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = organizations.id
        AND user_id = auth.uid()
        AND role = 'owner'
    ));

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Create RLS policies for organization_members
CREATE POLICY "Members can view their organization memberships" ON public.organization_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.organization_members om2
            WHERE om2.organization_id = organization_members.organization_id
            AND om2.user_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can manage members" ON public.organization_members
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    ));

-- Create RLS policies for skills
CREATE POLICY "Skills are viewable by everyone" ON public.skills
    FOR SELECT USING (true);

CREATE POLICY "Super admins can manage skills" ON public.skills
    FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Create RLS policies for mission_templates
CREATE POLICY "Mission templates are viewable by everyone" ON public.mission_templates
    FOR SELECT USING (true);

CREATE POLICY "Super admins can manage mission templates" ON public.mission_templates
    FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));