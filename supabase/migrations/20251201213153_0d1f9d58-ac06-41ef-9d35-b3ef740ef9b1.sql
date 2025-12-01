-- Add is_paused column to study_subjects for pausing auto-generation
ALTER TABLE public.study_subjects
ADD COLUMN is_paused boolean NOT NULL DEFAULT false;