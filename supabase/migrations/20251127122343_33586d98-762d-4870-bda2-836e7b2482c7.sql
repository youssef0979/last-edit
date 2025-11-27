-- Add session metadata fields to pomodoro_sessions
ALTER TABLE public.pomodoro_sessions
ADD COLUMN session_name TEXT,
ADD COLUMN cover_image_url TEXT,
ADD COLUMN status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'ongoing', 'abandoned'));

-- Create storage bucket for session cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pomodoro-covers', 'pomodoro-covers', true);

-- Storage policies for pomodoro cover images
CREATE POLICY "Users can upload their own pomodoro covers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pomodoro-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own pomodoro covers"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pomodoro-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own pomodoro covers"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'pomodoro-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own pomodoro covers"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'pomodoro-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Pomodoro covers are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pomodoro-covers');