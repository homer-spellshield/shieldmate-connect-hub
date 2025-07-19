-- Fix organization_members RLS policies completely
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can view other members in their organization" ON organization_members;
DROP POLICY IF EXISTS "Users can view members of same organization" ON organization_members;
DROP POLICY IF EXISTS "Organization owners can manage all members" ON organization_members;
DROP POLICY IF EXISTS "Organization owners can manage members" ON organization_members;
DROP POLICY IF EXISTS "Organization owners can insert new members" ON organization_members;
DROP POLICY IF EXISTS "Organization owners can insert members" ON organization_members;

-- Create simple, non-recursive policies using security definer function
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS TABLE(organization_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT om.organization_id 
  FROM organization_members om 
  WHERE om.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_organization_owner(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_members om 
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = org_id 
    AND om.role = 'owner'
  );
$$;

-- Create new policies using the functions
CREATE POLICY "Users can view their own membership" 
ON organization_members 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can view org members" 
ON organization_members 
FOR SELECT 
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Owners can manage members" 
ON organization_members 
FOR ALL 
USING (is_organization_owner(organization_id));

CREATE POLICY "Owners can insert members" 
ON organization_members 
FOR INSERT 
WITH CHECK (is_organization_owner(organization_id));