-- Create a secure SQL function to handle mission closure
CREATE OR REPLACE FUNCTION public.enforce_mission_closure_sql()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update missions that have been in pending_closure for more than 3 days
  UPDATE missions 
  SET 
    status = 'completed',
    closed_at = NOW()
  WHERE 
    status = 'pending_closure' 
    AND closure_initiated_at < NOW() - INTERVAL '3 days'
    AND closed_at IS NULL;
END;
$$;