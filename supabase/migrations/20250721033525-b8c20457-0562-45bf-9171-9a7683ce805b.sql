-- This migration ensures that the mission_messages and mission_files tables 
-- are properly recognized in the Supabase types by adding explicit type comments
-- This will trigger the TypeScript types to be regenerated

-- Add a comment to mission_messages table to ensure it's included in types
COMMENT ON TABLE public.mission_messages IS 'Chat messages for mission collaboration';

-- Add a comment to mission_files table to ensure it's included in types  
COMMENT ON TABLE public.mission_files IS 'File uploads for mission workspace';

-- Refresh the schema to ensure types are regenerated
NOTIFY pgrst, 'reload schema';