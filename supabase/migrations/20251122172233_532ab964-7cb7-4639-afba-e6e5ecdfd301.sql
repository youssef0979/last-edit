-- Create privacy settings table
CREATE TABLE public.privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  show_performance BOOLEAN NOT NULL DEFAULT true,
  show_habits BOOLEAN NOT NULL DEFAULT true,
  show_sleep BOOLEAN NOT NULL DEFAULT true,
  show_calendar BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own privacy settings
CREATE POLICY "Users can view their own privacy settings"
ON public.privacy_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own privacy settings
CREATE POLICY "Users can insert their own privacy settings"
ON public.privacy_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own privacy settings
CREATE POLICY "Users can update their own privacy settings"
ON public.privacy_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Admins can view all privacy settings
CREATE POLICY "Admins can view all privacy settings"
ON public.privacy_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_privacy_settings_updated_at
BEFORE UPDATE ON public.privacy_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Function to check if two users are friends (accepted status)
CREATE OR REPLACE FUNCTION public.are_friends(_user_id_1 uuid, _user_id_2 uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.friends
    WHERE status = 'accepted'
      AND (
        (requester_id = _user_id_1 AND addressee_id = _user_id_2)
        OR
        (requester_id = _user_id_2 AND addressee_id = _user_id_1)
      )
  )
$$;

-- Function to check if user allows friends to see their performance data
CREATE OR REPLACE FUNCTION public.can_view_performance(_viewer_id uuid, _owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN _viewer_id = _owner_id THEN true
      WHEN has_role(_viewer_id, 'admin'::app_role) THEN true
      ELSE (
        SELECT COALESCE(ps.show_performance, false)
        FROM public.privacy_settings ps
        WHERE ps.user_id = _owner_id
      ) AND public.are_friends(_viewer_id, _owner_id)
    END
$$;

-- Function to check if user allows friends to see their habits data
CREATE OR REPLACE FUNCTION public.can_view_habits(_viewer_id uuid, _owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN _viewer_id = _owner_id THEN true
      WHEN has_role(_viewer_id, 'admin'::app_role) THEN true
      ELSE (
        SELECT COALESCE(ps.show_habits, false)
        FROM public.privacy_settings ps
        WHERE ps.user_id = _owner_id
      ) AND public.are_friends(_viewer_id, _owner_id)
    END
$$;

-- Function to check if user allows friends to see their sleep data
CREATE OR REPLACE FUNCTION public.can_view_sleep(_viewer_id uuid, _owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN _viewer_id = _owner_id THEN true
      WHEN has_role(_viewer_id, 'admin'::app_role) THEN true
      ELSE (
        SELECT COALESCE(ps.show_sleep, false)
        FROM public.privacy_settings ps
        WHERE ps.user_id = _owner_id
      ) AND public.are_friends(_viewer_id, _owner_id)
    END
$$;

-- Function to check if user allows friends to see their calendar data
CREATE OR REPLACE FUNCTION public.can_view_calendar(_viewer_id uuid, _owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN _viewer_id = _owner_id THEN true
      WHEN has_role(_viewer_id, 'admin'::app_role) THEN true
      ELSE (
        SELECT COALESCE(ps.show_calendar, false)
        FROM public.privacy_settings ps
        WHERE ps.user_id = _owner_id
      ) AND public.are_friends(_viewer_id, _owner_id)
    END
$$;

-- Add new RLS policies for friends to view data (if privacy allows)

-- Performance habits: Friends can view if allowed
CREATE POLICY "Friends can view performance habits if allowed"
ON public.performance_habits
FOR SELECT
TO authenticated
USING (public.can_view_performance(auth.uid(), user_id));

-- Performance scores: Friends can view if allowed
CREATE POLICY "Friends can view performance scores if allowed"
ON public.performance_scores
FOR SELECT
TO authenticated
USING (public.can_view_performance(auth.uid(), user_id));

-- Habits: Friends can view if allowed
CREATE POLICY "Friends can view habits if allowed"
ON public.habits
FOR SELECT
TO authenticated
USING (public.can_view_habits(auth.uid(), user_id));

-- Habit completions: Friends can view if allowed
CREATE POLICY "Friends can view habit completions if allowed"
ON public.habit_completions
FOR SELECT
TO authenticated
USING (public.can_view_habits(auth.uid(), user_id));

-- Habit notes: Friends can view if allowed
CREATE POLICY "Friends can view habit notes if allowed"
ON public.habit_notes
FOR SELECT
TO authenticated
USING (public.can_view_habits(auth.uid(), user_id));

-- Sleep entries: Friends can view if allowed
CREATE POLICY "Friends can view sleep entries if allowed"
ON public.sleep_entries
FOR SELECT
TO authenticated
USING (public.can_view_sleep(auth.uid(), user_id));

-- Calendar notes: Friends can view if allowed
CREATE POLICY "Friends can view calendar notes if allowed"
ON public.calendar_notes
FOR SELECT
TO authenticated
USING (public.can_view_calendar(auth.uid(), user_id));