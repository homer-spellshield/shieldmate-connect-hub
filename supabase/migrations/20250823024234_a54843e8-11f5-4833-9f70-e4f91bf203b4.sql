-- Stricter access for profiles: add least-privilege functions and limit shared fields

-- 1) Create a secure function for users to fetch ONLY their own full profile
CREATE OR REPLACE FUNCTION public.get_own_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT *
  FROM public.profiles
  WHERE user_id = auth.uid();
$$;

-- 2) Limit the data shared via mission participation: remove email from the RPC
--    Replace the existing function to stop returning email to participants
CREATE OR REPLACE FUNCTION public.get_profile_for_mission(p_mission_id uuid, p_user_id uuid)
RETURNS TABLE(user_id uuid, first_name text, last_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT pr.user_id, pr.first_name, pr.last_name
  FROM public.profiles pr
  WHERE pr.user_id = p_user_id
    AND public.is_mission_participant(p_mission_id, auth.uid());
$function$;
