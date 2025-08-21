-- Fix RLS policies to require authentication instead of public access
-- Update missions table policies
DROP POLICY IF EXISTS "Missions are viewable by everyone" ON public.missions;
CREATE POLICY "Authenticated users can view missions" 
ON public.missions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update skills table policies  
DROP POLICY IF EXISTS "Skills are viewable by everyone" ON public.skills;
CREATE POLICY "Authenticated users can view skills"
ON public.skills
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Update mission_templates table policies
DROP POLICY IF EXISTS "Mission templates are viewable by everyone" ON public.mission_templates;
CREATE POLICY "Authenticated users can view mission templates"
ON public.mission_templates
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Update mission_template_skills table policies
DROP POLICY IF EXISTS "Mission template skills are viewable by everyone" ON public.mission_template_skills;
CREATE POLICY "Authenticated users can view mission template skills"
ON public.mission_template_skills
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add admin function to delete missions for testing
CREATE OR REPLACE FUNCTION public.admin_delete_missions(p_mission_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only super admins can delete missions
  IF NOT has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'You do not have permission to delete missions.';
  END IF;

  -- Delete related data first (CASCADE should handle this but being explicit)
  DELETE FROM mission_applications WHERE mission_id = ANY(p_mission_ids);
  DELETE FROM mission_messages WHERE mission_id = ANY(p_mission_ids);
  DELETE FROM mission_files WHERE mission_id = ANY(p_mission_ids);
  DELETE FROM mission_ratings WHERE mission_id = ANY(p_mission_ids);
  
  -- Delete the missions
  DELETE FROM missions WHERE id = ANY(p_mission_ids);
END;
$function$;