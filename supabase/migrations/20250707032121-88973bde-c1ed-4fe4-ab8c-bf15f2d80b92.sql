-- Update the handle_new_user function to assign organization_owner role by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  -- Default role is organization_owner for new signups
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'organization_owner');
  
  RETURN NEW;
END;
$function$;