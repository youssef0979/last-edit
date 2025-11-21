-- Create separate performance_habits table for Performance Tracker
CREATE TABLE IF NOT EXISTS public.performance_habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on performance_habits
ALTER TABLE public.performance_habits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for performance_habits
CREATE POLICY "Users can view their own performance habits"
ON public.performance_habits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own performance habits"
ON public.performance_habits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own performance habits"
ON public.performance_habits
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own performance habits"
ON public.performance_habits
FOR DELETE
USING (auth.uid() = user_id);

-- Drop existing foreign key constraint on performance_scores
ALTER TABLE public.performance_scores DROP CONSTRAINT IF EXISTS performance_scores_habit_id_fkey;

-- Add new foreign key constraint to performance_habits
ALTER TABLE public.performance_scores
ADD CONSTRAINT performance_scores_performance_habit_id_fkey
FOREIGN KEY (habit_id)
REFERENCES public.performance_habits(id)
ON DELETE CASCADE;

-- Rename habit_id column in performance_scores to performance_habit_id for clarity
ALTER TABLE public.performance_scores
RENAME COLUMN habit_id TO performance_habit_id;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_performance_habits_user_id ON public.performance_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_scores_performance_habit_id ON public.performance_scores(performance_habit_id);