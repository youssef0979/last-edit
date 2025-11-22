-- Drop the existing view
DROP VIEW IF EXISTS public.friends_readable;

-- Recreate the view without security definer
CREATE VIEW public.friends_readable AS
SELECT 
  f.id,
  f.requester_id,
  f.addressee_id,
  f.status,
  f.created_at,
  f.updated_at,
  p1.username AS requester_username,
  p1.full_name AS requester_full_name,
  p1.avatar_url AS requester_avatar_url,
  p2.username AS addressee_username,
  p2.full_name AS addressee_full_name,
  p2.avatar_url AS addressee_avatar_url
FROM public.friends f
JOIN public.profiles p1 ON f.requester_id = p1.id
JOIN public.profiles p2 ON f.addressee_id = p2.id;

-- Enable RLS on the view
ALTER VIEW public.friends_readable SET (security_invoker = true);

-- Grant access to authenticated users
GRANT SELECT ON public.friends_readable TO authenticated;