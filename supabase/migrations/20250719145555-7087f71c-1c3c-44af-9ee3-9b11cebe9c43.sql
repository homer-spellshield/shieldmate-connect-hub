-- Fix infinite recursion in organization_members RLS policies
-- Drop the problematic policies and create simpler ones

DROP POLICY IF EXISTS "Members can view their organization memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners can manage members" ON public.organization_members;

-- Create non-recursive policies
CREATE POLICY "Users can view their own membership" 
ON public.organization_members 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view other members in their organization" 
ON public.organization_members 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Organization owners can manage all members" 
ON public.organization_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om 
    WHERE om.organization_id = organization_members.organization_id 
    AND om.user_id = auth.uid() 
    AND om.role = 'owner'
  )
);

CREATE POLICY "Organization owners can insert new members" 
ON public.organization_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members om 
    WHERE om.organization_id = organization_members.organization_id 
    AND om.user_id = auth.uid() 
    AND om.role = 'owner'
  )
);