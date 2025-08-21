-- Fix function search path security warning
-- Update all functions to have immutable search_path
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