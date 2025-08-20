-- Create a SECURITY DEFINER function to safely manage team invitations
CREATE OR REPLACE FUNCTION public.handle_team_invitation(
  p_email text,
  p_role text,
  p_organization_id uuid,
  p_inviter_user_id uuid
)
RETURNS TABLE(outcome text, user_id uuid, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_already_member boolean;
BEGIN
  -- Ensure inviter is an owner of the organization
  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_organization_id
      AND om.user_id = p_inviter_user_id
      AND om.role = 'owner'
  ) THEN
    RAISE EXCEPTION 'You do not have permission to invite members to this organization.';
  END IF;

  -- Lookup user by email in auth.users (allowed in SECURITY DEFINER)
  SELECT u.id
  INTO v_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(p_email)
  LIMIT 1;

  -- If user does not exist, instruct caller to send invitation
  IF v_user_id IS NULL THEN
    outcome := 'send_invite';
    user_id := NULL;
    message := 'User does not exist; send invitation email.';
    RETURN NEXT;
    RETURN;
  END IF;

  -- If user exists, check if they are already a member
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_organization_id
      AND om.user_id = v_user_id
  ) INTO v_already_member;

  IF v_already_member THEN
    outcome := 'already_member';
    user_id := v_user_id;
    message := 'User is already a member of the organization.';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Add existing user to organization with provided role (default to "member")
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (p_organization_id, v_user_id, COALESCE(NULLIF(trim(p_role), ''), 'member'));

  outcome := 'added_existing_user';
  user_id := v_user_id;
  message := 'Existing user added to organization.';
  RETURN NEXT;
  RETURN;
END;
$$;