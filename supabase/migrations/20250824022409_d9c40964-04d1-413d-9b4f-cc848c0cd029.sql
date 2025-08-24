-- Drop the problematic policies that are still causing recursion
DROP POLICY IF EXISTS "Organization members can view their org missions" ON public.missions;
DROP POLICY IF EXISTS "Org members view applications for their missions" ON public.mission_applications;

-- Create simpler, non-recursive policies for organization access
CREATE POLICY "Org members view own org missions"
ON public.missions FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org members view apps for own org missions"
ON public.mission_applications FOR SELECT
USING (
  mission_id IN (
    SELECT id 
    FROM public.missions 
    WHERE organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  )
);