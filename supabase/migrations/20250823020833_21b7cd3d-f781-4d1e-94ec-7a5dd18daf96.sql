-- Tighten profiles access: enforce RLS and explicitly deny anon reads
-- 1) Ensure RLS is enabled and enforced
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- 2) Explicitly deny anonymous (unauthenticated) users from selecting any profile rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'No anonymous access to profiles'
  ) THEN
    CREATE POLICY "No anonymous access to profiles"
    ON public.profiles
    FOR SELECT
    TO anon
    USING (false);
  END IF;
END$$ LANGUAGE plpgsql;
