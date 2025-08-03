-- Add domain field to skills table to support hierarchy
ALTER TABLE public.skills 
ADD COLUMN domain text;

-- Add indexes for better performance on hierarchical queries
CREATE INDEX idx_skills_category ON public.skills(category);
CREATE INDEX idx_skills_domain ON public.skills(domain);
CREATE INDEX idx_skills_category_domain ON public.skills(category, domain);