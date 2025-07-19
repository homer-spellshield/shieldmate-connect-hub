-- Fix organization_members RLS policies to prevent infinite recursion
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can view other members in their organization" ON organization_members;
DROP POLICY IF EXISTS "Organization owners can manage all members" ON organization_members;
DROP POLICY IF EXISTS "Organization owners can insert new members" ON organization_members;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own membership" 
ON organization_members 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view members of same organization" 
ON organization_members 
FOR SELECT 
USING (
  organization_id = ANY(
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Organization owners can manage members" 
ON organization_members 
FOR ALL 
USING (
  organization_id = ANY(
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "Organization owners can insert members" 
ON organization_members 
FOR INSERT 
WITH CHECK (
  organization_id = ANY(
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);