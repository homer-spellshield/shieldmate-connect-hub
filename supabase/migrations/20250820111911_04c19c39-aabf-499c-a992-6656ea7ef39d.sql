-- Remove the insecure cron job with hardcoded bearer token
SELECT cron.unschedule('auto-close-missions');

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

-- Schedule the secure function to run daily at midnight
SELECT cron.schedule(
    'auto-close-missions-secure',
    '0 0 * * *',
    $$SELECT public.enforce_mission_closure_sql();$$
);