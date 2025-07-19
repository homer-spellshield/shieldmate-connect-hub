-- Create a table to store chat messages for each mission
CREATE TABLE public.mission_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a table to store file uploads for each mission
CREATE TABLE public.mission_files (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) on the new tables
ALTER TABLE public.mission_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_files ENABLE ROW LEVEL SECURITY;

-- Create a helper function to check if a user is part of a mission
CREATE OR REPLACE FUNCTION public.is_mission_participant(_mission_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    -- User is an accepted volunteer for the mission
    (SELECT 1 FROM public.mission_applications
     WHERE mission_id = _mission_id AND volunteer_id = _user_id AND status = 'accepted')
    OR
    -- User is a member of the organization that owns the mission
    (SELECT 1 FROM public.missions m
     JOIN public.organization_members om ON m.organization_id = om.organization_id
     WHERE m.id = _mission_id AND om.user_id = _user_id)
  );
$$;

-- RLS Policies for mission_messages
CREATE POLICY "Mission participants can view messages"
ON public.mission_messages FOR SELECT
USING (public.is_mission_participant(mission_id, auth.uid()));

CREATE POLICY "Mission participants can send messages"
ON public.mission_messages FOR INSERT
WITH CHECK (public.is_mission_participant(mission_id, auth.uid()) AND user_id = auth.uid());

-- RLS Policies for mission_files
CREATE POLICY "Mission participants can view files"
ON public.mission_files FOR SELECT
USING (public.is_mission_participant(mission_id, auth.uid()));

CREATE POLICY "Mission participants can upload files"
ON public.mission_files FOR INSERT
WITH CHECK (public.is_mission_participant(mission_id, auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can delete their own files"
ON public.mission_files FOR DELETE
USING (user_id = auth.uid());


-- Set up Supabase Storage for mission files
-- Create a new storage bucket called 'mission-files'
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('mission-files', 'mission-files', false, 20971520) -- 20MB limit
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for 'mission-files' bucket
CREATE POLICY "Mission participants can view files in their mission folder"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'mission-files' AND
  public.is_mission_participant((storage.foldername(name))[1]::uuid, auth.uid())
);

CREATE POLICY "Mission participants can upload files to their mission folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'mission-files' AND
  public.is_mission_participant((storage.foldername(name))[1]::uuid, auth.uid())
);

CREATE POLICY "Users can delete their own files from storage"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'mission-files' AND
  owner = auth.uid()
);