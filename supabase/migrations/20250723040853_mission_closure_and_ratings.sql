-- Add new columns to the missions table for tracking closure
ALTER TABLE public.missions
ADD COLUMN IF NOT EXISTS org_closed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS volunteer_closed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS closure_initiated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Create a new table for user notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for the notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Create a new table for mission ratings
CREATE TABLE IF NOT EXISTS public.mission_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    rater_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(mission_id, rater_user_id) -- A user can only rate once per mission
);

-- Enable RLS for the ratings table
ALTER TABLE public.mission_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Participants of a mission can see ratings for that mission
CREATE POLICY "Mission participants can view ratings"
ON public.mission_ratings FOR SELECT
USING (public.is_mission_participant(mission_id, auth.uid()));

-- RLS Policy: Users can create and update their own ratings
CREATE POLICY "Users can manage their own ratings"
ON public.mission_ratings FOR ALL
USING (auth.uid() = rater_user_id);