-- Add RLS policy for super admins to view all missions
CREATE POLICY "Super admins can view all missions"
ON public.missions FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));