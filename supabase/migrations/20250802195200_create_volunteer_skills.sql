-- Create a junction table to link volunteers (via their user_id in profiles) to skills.
-- This creates a many-to-many relationship.
CREATE TABLE IF NOT EXISTS public.volunteer_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  volunteer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(volunteer_id, skill_id) -- Ensures a skill can only be assigned to a volunteer once.
);

-- Enable Row Level Security for the new table.
ALTER TABLE public.volunteer_skills ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES for volunteer_skills

-- 1. Allow super admins to do anything.
-- This is the primary policy for managing volunteer skills.
CREATE POLICY "Super admins can manage all volunteer skills"
ON public.volunteer_skills
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 2. Allow volunteers to see their own assigned skills.
CREATE POLICY "Users can view their own skills"
ON public.volunteer_skills
FOR SELECT
USING (auth.uid() = volunteer_id);

-- 3. Allow authenticated users (like organisations) to see the skills of any volunteer.
-- This is necessary for organisations to review the skills of applicants.
CREATE POLICY "Authenticated users can view any volunteer's skills"
ON public.volunteer_skills
FOR SELECT
USING (auth.role() = 'authenticated');
