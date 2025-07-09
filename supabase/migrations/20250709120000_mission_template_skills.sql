-- supabase/migrations/20250709120000_mission_template_skills.sql

-- Create a junction table to link mission templates with the skills they require.
-- This creates a many-to-many relationship. One template can have many skills,
-- and one skill can be used in many templates.
CREATE TABLE IF NOT EXISTS public.mission_template_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.mission_templates(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(template_id, skill_id) -- Ensures a skill can only be added to a template once.
);

-- Enable Row Level Security for the new table.
ALTER TABLE public.mission_template_skills ENABLE ROW LEVEL SECURITY;

-- Define RLS policies for the new junction table.
-- Policy: Allow everyone to view which skills are linked to which templates.
-- This is public information needed by organizations when creating a mission.
CREATE POLICY "Templates-skills links are viewable by everyone"
ON public.mission_template_skills
FOR SELECT
USING (true);

-- Policy: Only allow super admins to create, update, or delete the links
-- between templates and skills.
CREATE POLICY "Super admins can manage template-skill links"
ON public.mission_template_skills
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));