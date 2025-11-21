-- Create calendar_notes table
CREATE TABLE IF NOT EXISTS public.calendar_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  color TEXT DEFAULT '#3b82f6',
  reminder_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, title)
);

-- Enable RLS on calendar_notes
ALTER TABLE public.calendar_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for calendar_notes
CREATE POLICY "Users can view their own calendar notes"
ON public.calendar_notes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar notes"
ON public.calendar_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar notes"
ON public.calendar_notes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar notes"
ON public.calendar_notes
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_calendar_notes_user_id ON public.calendar_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_notes_date ON public.calendar_notes(date);

-- Create trigger for updated_at
CREATE TRIGGER update_calendar_notes_updated_at
BEFORE UPDATE ON public.calendar_notes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();