
-- Create missions table for organization-posted missions
CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.mission_templates(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open',
  estimated_hours INTEGER,
  difficulty_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow everyone to view missions (so volunteers can see open missions)
CREATE POLICY "Missions are viewable by everyone"
ON public.missions
FOR SELECT
USING (true);

-- Policy: Allow organization members to create missions for their organization
CREATE POLICY "Organization members can create missions"
ON public.missions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = missions.organization_id 
    AND user_id = auth.uid()
  )
);

-- Policy: Allow organization members to update missions for their organization
CREATE POLICY "Organization members can update their missions"
ON public.missions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = missions.organization_id 
    AND user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_missions_updated_at
BEFORE UPDATE ON public.missions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
