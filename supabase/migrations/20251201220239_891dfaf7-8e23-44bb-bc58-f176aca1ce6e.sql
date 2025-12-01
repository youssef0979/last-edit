-- Enable realtime for study_lessons table
ALTER TABLE public.study_lessons REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_lessons;