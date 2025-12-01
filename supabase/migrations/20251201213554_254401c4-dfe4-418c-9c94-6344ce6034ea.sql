-- Create homework table
CREATE TABLE public.study_homework (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES public.study_subjects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  amount_type text NOT NULL DEFAULT 'pages',
  deadline date NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_homework ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own homework"
  ON public.study_homework FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own homework"
  ON public.study_homework FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own homework"
  ON public.study_homework FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own homework"
  ON public.study_homework FOR DELETE
  USING (auth.uid() = user_id);