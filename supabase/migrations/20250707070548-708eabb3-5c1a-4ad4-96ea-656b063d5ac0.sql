-- Update the handle_new_user function to default to organization_owner role
-- Remove user_type logic since all signups are organizations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  -- All signups are organizations, so assign organization_owner role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'organization_owner');
  
  RETURN NEW;
END;
$$;