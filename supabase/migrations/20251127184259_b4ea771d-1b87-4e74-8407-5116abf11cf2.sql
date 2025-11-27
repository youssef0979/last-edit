-- Create enum for session status
CREATE TYPE public.session_status AS ENUM ('planned', 'completed', 'skipped');

-- Create enum for weight unit
CREATE TYPE public.weight_unit AS ENUM ('kg', 'lbs');

-- Exercise Folders Table
CREATE TABLE public.exercise_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exercise_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own folders"
  ON public.exercise_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
  ON public.exercise_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON public.exercise_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON public.exercise_folders FOR DELETE
  USING (auth.uid() = user_id);

-- Exercises Table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.exercise_folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  primary_muscle TEXT,
  unit public.weight_unit NOT NULL DEFAULT 'kg',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exercises"
  ON public.exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercises"
  ON public.exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercises"
  ON public.exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Sessions Table
CREATE TABLE public.gym_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_index INTEGER NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  status public.session_status NOT NULL DEFAULT 'planned',
  preset_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_index)
);

ALTER TABLE public.gym_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON public.gym_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.gym_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.gym_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.gym_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Set Entries Table
CREATE TABLE public.set_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.gym_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight NUMERIC NOT NULL,
  reps INTEGER NOT NULL,
  unit public.weight_unit NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.set_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own set entries"
  ON public.set_entries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.gym_sessions
    WHERE gym_sessions.id = set_entries.session_id
    AND gym_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own set entries"
  ON public.set_entries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.gym_sessions
    WHERE gym_sessions.id = set_entries.session_id
    AND gym_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own set entries"
  ON public.set_entries FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.gym_sessions
    WHERE gym_sessions.id = set_entries.session_id
    AND gym_sessions.user_id = auth.uid()
  ));

-- Exercise Stats Table
CREATE TABLE public.exercise_stats (
  exercise_id UUID PRIMARY KEY REFERENCES public.exercises(id) ON DELETE CASCADE,
  last_best_set_value NUMERIC,
  estimated_1rm NUMERIC,
  total_volume NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exercise_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exercise stats"
  ON public.exercise_stats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exercises
    WHERE exercises.id = exercise_stats.exercise_id
    AND exercises.user_id = auth.uid()
  ));

-- Create trigger for updated_at on folders
CREATE TRIGGER update_exercise_folders_updated_at
  BEFORE UPDATE ON public.exercise_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for updated_at on sessions
CREATE TRIGGER update_gym_sessions_updated_at
  BEFORE UPDATE ON public.gym_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_exercises_user_folder ON public.exercises(user_id, folder_id);
CREATE INDEX idx_gym_sessions_user_index ON public.gym_sessions(user_id, session_index DESC);
CREATE INDEX idx_set_entries_session ON public.set_entries(session_id);
CREATE INDEX idx_set_entries_exercise ON public.set_entries(exercise_id);