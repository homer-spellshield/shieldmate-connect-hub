-- EMERGENCY FIX: Remove ALL problematic RLS policies causing infinite recursion

-- 1. Drop ALL current policies on organizations table
DROP POLICY IF EXISTS "Open missions show basic org info" ON public.organizations;
DROP POLICY IF EXISTS "Mission applicants can view basic org info" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Org members can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update their org" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can update any organisation" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can view all organizations" ON public.organizations;

-- 2. Drop problematic policies on missions table
DROP POLICY IF EXISTS "Public can view open missions for discovery" ON public.missions;

-- 3. Create SIMPLE, safe policies for organizations
CREATE POLICY "Users can create organizations" ON public.organizations
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Organization members can view their org" ON public.organizations
FOR SELECT 
TO authenticated
USING (
  id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
);

CREATE POLICY "Organization owners can update" ON public.organizations
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = organizations.id 
    AND user_id = auth.uid() 
    AND role = 'owner'
  )
);

CREATE POLICY "Super admins can manage all orgs" ON public.organizations
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- 4. Create safe policy for public mission discovery (NO organization reference)
CREATE POLICY "Anyone can view open missions" ON public.missions
FOR SELECT 
TO authenticated
USING (status = 'open');

-- 5. Create security definer function to safely get organization info for missions
CREATE OR REPLACE FUNCTION public.get_mission_organization_info(p_mission_id uuid)
RETURNS TABLE(organization_name text, organization_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT o.name::text, o.id::uuid
  FROM public.missions m
  JOIN public.organizations o ON m.organization_id = o.id
  WHERE m.id = p_mission_id;
END;
$$;