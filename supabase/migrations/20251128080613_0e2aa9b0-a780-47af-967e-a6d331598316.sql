-- Create time_blocks table for schedule time-blocking feature
CREATE TABLE public.time_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own time blocks" 
ON public.time_blocks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own time blocks" 
ON public.time_blocks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time blocks" 
ON public.time_blocks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time blocks" 
ON public.time_blocks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_time_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_time_blocks_updated_at
BEFORE UPDATE ON public.time_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_time_blocks_updated_at();