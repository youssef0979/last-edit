-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username TEXT UNIQUE;

-- Add constraint to ensure username follows a good format
ALTER TABLE public.profiles
ADD CONSTRAINT username_format 
CHECK (username ~ '^[a-zA-Z0-9_-]{3,20}$');

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

COMMENT ON COLUMN public.profiles.username IS 'Unique username chosen by user, 3-20 characters, alphanumeric with dashes and underscores';