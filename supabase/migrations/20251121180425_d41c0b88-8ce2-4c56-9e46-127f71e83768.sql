-- Create habits table
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on habits
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- RLS policies for habits
CREATE POLICY "Users can view their own habits"
  ON public.habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habits"
  ON public.habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
  ON public.habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON public.habits FOR DELETE
  USING (auth.uid() = user_id);

-- Create performance_scores table
CREATE TABLE public.performance_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(habit_id, date)
);

-- Enable RLS on performance_scores
ALTER TABLE public.performance_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for performance_scores
CREATE POLICY "Users can view their own scores"
  ON public.performance_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scores"
  ON public.performance_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores"
  ON public.performance_scores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scores"
  ON public.performance_scores FOR DELETE
  USING (auth.uid() = user_id);

-- Create performance_cycles table for tracking 2-week periods
CREATE TABLE public.performance_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on performance_cycles
ALTER TABLE public.performance_cycles ENABLE ROW LEVEL SECURITY;

-- RLS policies for performance_cycles
CREATE POLICY "Users can view their own cycles"
  ON public.performance_cycles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cycles"
  ON public.performance_cycles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cycles"
  ON public.performance_cycles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_habits_user_id ON public.habits(user_id);
CREATE INDEX idx_performance_scores_user_id ON public.performance_scores(user_id);
CREATE INDEX idx_performance_scores_habit_id ON public.performance_scores(habit_id);
CREATE INDEX idx_performance_scores_date ON public.performance_scores(date);
CREATE INDEX idx_performance_cycles_user_id ON public.performance_cycles(user_id);
CREATE INDEX idx_performance_cycles_current ON public.performance_cycles(is_current) WHERE is_current = true;