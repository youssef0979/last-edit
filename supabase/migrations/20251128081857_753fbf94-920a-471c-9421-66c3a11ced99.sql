-- Add note_id reference to time_blocks table
ALTER TABLE public.time_blocks
ADD COLUMN note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL;

-- Create index for quick lookup
CREATE INDEX idx_time_blocks_note_id ON public.time_blocks(note_id);

-- Add comment for documentation
COMMENT ON COLUMN public.time_blocks.note_id IS 'Optional reference to a note in the notes workspace';