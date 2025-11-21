-- Create sleep_entries table for Sleep Tracker
CREATE TABLE IF NOT EXISTS public.sleep_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  hours_slept NUMERIC(4,2) NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN ('happy', 'neutral', 'sad')),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  bedtime TIME,
  wake_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create sleep_cycles table for 2-week cycle management
CREATE TABLE IF NOT EXISTS public.sleep_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sleep_entries
ALTER TABLE public.sleep_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sleep_entries
CREATE POLICY "Users can view their own sleep entries"
ON public.sleep_entries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sleep entries"
ON public.sleep_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep entries"
ON public.sleep_entries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep entries"
ON public.sleep_entries
FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on sleep_cycles
ALTER TABLE public.sleep_cycles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sleep_cycles
CREATE POLICY "Users can view their own sleep cycles"
ON public.sleep_cycles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sleep cycles"
ON public.sleep_cycles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep cycles"
ON public.sleep_cycles
FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sleep_entries_user_id ON public.sleep_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_entries_date ON public.sleep_entries(date);
CREATE INDEX IF NOT EXISTS idx_sleep_cycles_user_id ON public.sleep_cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_cycles_current ON public.sleep_cycles(user_id, is_current);