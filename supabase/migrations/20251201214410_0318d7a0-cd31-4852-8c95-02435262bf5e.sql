-- Create exams table
CREATE TABLE public.study_exams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES public.study_subjects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  exam_date date NOT NULL,
  topics text NOT NULL,
  importance text NOT NULL DEFAULT 'medium',
  notes text,
  status text NOT NULL DEFAULT 'upcoming',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_exams ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own exams"
  ON public.study_exams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exams"
  ON public.study_exams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exams"
  ON public.study_exams FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exams"
  ON public.study_exams FOR DELETE
  USING (auth.uid() = user_id);