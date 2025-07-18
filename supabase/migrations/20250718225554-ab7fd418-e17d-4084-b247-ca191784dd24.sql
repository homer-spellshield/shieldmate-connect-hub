-- Create mission_applications table
CREATE TABLE public.mission_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL,
  volunteer_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  application_message TEXT,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mission_id, volunteer_id)
);

-- Create volunteer_skills junction table
CREATE TABLE public.volunteer_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  volunteer_id UUID NOT NULL,
  skill_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(volunteer_id, skill_id)
);

-- Enable RLS on mission_applications
ALTER TABLE public.mission_applications ENABLE ROW LEVEL SECURITY;

-- Enable RLS on volunteer_skills
ALTER TABLE public.volunteer_skills ENABLE ROW LEVEL SECURITY;

-- RLS policies for mission_applications
CREATE POLICY "Volunteers can view their own applications" 
ON public.mission_applications 
FOR SELECT 
USING (volunteer_id = auth.uid());

CREATE POLICY "Volunteers can create applications" 
ON public.mission_applications 
FOR INSERT 
WITH CHECK (volunteer_id = auth.uid() AND status = 'pending');

CREATE POLICY "Organization members can view applications for their missions" 
ON public.mission_applications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM missions m 
    JOIN organization_members om ON m.organization_id = om.organization_id 
    WHERE m.id = mission_applications.mission_id 
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can update applications for their missions" 
ON public.mission_applications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM missions m 
    JOIN organization_members om ON m.organization_id = om.organization_id 
    WHERE m.id = mission_applications.mission_id 
    AND om.user_id = auth.uid()
  )
);

-- RLS policies for volunteer_skills
CREATE POLICY "Users can view their own skills" 
ON public.volunteer_skills 
FOR SELECT 
USING (volunteer_id = auth.uid());

CREATE POLICY "Super admins can manage all volunteer skills" 
ON public.volunteer_skills 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Volunteer skills are viewable by organization members for applications" 
ON public.volunteer_skills 
FOR SELECT 
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_mission_applications_updated_at
BEFORE UPDATE ON public.mission_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_volunteer_skills_updated_at
BEFORE UPDATE ON public.volunteer_skills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();