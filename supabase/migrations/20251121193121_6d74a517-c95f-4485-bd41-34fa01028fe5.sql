-- Remove email column from profiles table to prevent email exposure
-- Emails are already securely stored in auth.users table

-- Update the handle_new_user function to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$function$;

-- Remove the email column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;