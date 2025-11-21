-- Add new columns to habits table
ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS difficulty_weight INTEGER DEFAULT 1 CHECK (difficulty_weight >= 1 AND difficulty_weight <= 3),
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS is_preloaded BOOLEAN DEFAULT false;

-- Create habit_completions table
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(habit_id, date)
);

-- Enable RLS on habit_completions
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for habit_completions
CREATE POLICY "Users can view their own completions" 
ON public.habit_completions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own completions" 
ON public.habit_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completions" 
ON public.habit_completions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completions" 
ON public.habit_completions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create habit_cycles table
CREATE TABLE IF NOT EXISTS public.habit_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on habit_cycles
ALTER TABLE public.habit_cycles ENABLE ROW LEVEL SECURITY;

-- RLS policies for habit_cycles
CREATE POLICY "Users can view their own cycles" 
ON public.habit_cycles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cycles" 
ON public.habit_cycles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cycles" 
ON public.habit_cycles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create habit_notes table
CREATE TABLE IF NOT EXISTS public.habit_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on habit_notes
ALTER TABLE public.habit_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for habit_notes
CREATE POLICY "Users can view their own notes" 
ON public.habit_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
ON public.habit_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON public.habit_notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.habit_notes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON public.habit_completions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON public.habit_completions(habit_id, date);
CREATE INDEX IF NOT EXISTS idx_habit_cycles_user_current ON public.habit_cycles(user_id, is_current);
CREATE INDEX IF NOT EXISTS idx_habit_notes_user_date ON public.habit_notes(user_id, date);