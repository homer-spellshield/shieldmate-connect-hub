-- Add closure_initiated_at column to missions table
ALTER TABLE public.missions 
ADD COLUMN IF NOT EXISTS closure_initiated_at TIMESTAMP WITH TIME ZONE;

-- Update mission statuses to include pending_closure
-- First check if we need to update any existing missions
UPDATE public.missions 
SET status = 'in_progress' 
WHERE status = 'open' AND EXISTS (
  SELECT 1 FROM mission_applications 
  WHERE mission_id = missions.id AND status = 'accepted'
);

-- Add index for better performance on closure queries
CREATE INDEX IF NOT EXISTS idx_missions_closure_status 
ON public.missions(status, closure_initiated_at) 
WHERE status = 'pending_closure';