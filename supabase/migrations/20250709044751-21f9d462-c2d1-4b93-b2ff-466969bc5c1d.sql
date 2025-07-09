-- Create junction table for mission templates and skills
CREATE TABLE public.mission_template_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES public.mission_templates(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(template_id, skill_id)
);

-- Enable Row Level Security
ALTER TABLE public.mission_template_skills ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "Mission template skills are viewable by everyone" 
ON public.mission_template_skills 
FOR SELECT 
USING (true);

-- Policy for super admin write access
CREATE POLICY "Super admins can manage mission template skills" 
ON public.mission_template_skills 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));