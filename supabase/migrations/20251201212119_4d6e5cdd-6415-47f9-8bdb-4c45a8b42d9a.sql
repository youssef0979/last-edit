-- Add new columns to study_subjects for lesson scheduling
ALTER TABLE public.study_subjects 
ADD COLUMN pending_lessons INTEGER NOT NULL DEFAULT 0,
ADD COLUMN release_schedule TEXT DEFAULT NULL,
ADD COLUMN release_day TEXT DEFAULT NULL,
ADD COLUMN release_time TIME DEFAULT NULL,
ADD COLUMN next_release_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create study_lessons table
CREATE TABLE public.study_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.study_subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  lesson_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  released_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on study_lessons
ALTER TABLE public.study_lessons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for study_lessons
CREATE POLICY "Users can view their own lessons"
  ON public.study_lessons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lessons"
  ON public.study_lessons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lessons"
  ON public.study_lessons FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lessons"
  ON public.study_lessons FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at on study_lessons
CREATE TRIGGER update_study_lessons_updated_at
  BEFORE UPDATE ON public.study_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_study_lessons_subject_id ON public.study_lessons(subject_id);
CREATE INDEX idx_study_lessons_user_id ON public.study_lessons(user_id);