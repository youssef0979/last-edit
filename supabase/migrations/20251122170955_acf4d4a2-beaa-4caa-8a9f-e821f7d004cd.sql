-- Create enum for friend request status
CREATE TYPE public.friend_status AS ENUM ('pending', 'accepted', 'rejected', 'blocked');

-- Create friends table
CREATE TABLE public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status friend_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent self-friending
  CONSTRAINT no_self_friend CHECK (requester_id != addressee_id),
  
  -- Prevent duplicate requests (either direction)
  CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id)
);

-- Create index for faster lookups
CREATE INDEX idx_friends_requester ON public.friends(requester_id);
CREATE INDEX idx_friends_addressee ON public.friends(addressee_id);
CREATE INDEX idx_friends_status ON public.friends(status);

-- Enable RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view friend requests where they are involved
CREATE POLICY "Users can view their own friend relationships"
ON public.friends
FOR SELECT
TO authenticated
USING (
  auth.uid() = requester_id OR 
  auth.uid() = addressee_id
);

-- RLS Policy: Users can send friend requests (insert as requester)
CREATE POLICY "Users can send friend requests"
ON public.friends
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = requester_id AND
  status = 'pending'
);

-- RLS Policy: Users can update requests they sent (cancel) or received (accept/reject)
CREATE POLICY "Users can update their friend requests"
ON public.friends
FOR UPDATE
TO authenticated
USING (
  auth.uid() = requester_id OR 
  auth.uid() = addressee_id
);

-- RLS Policy: Users can delete their own sent requests or block relationships
CREATE POLICY "Users can delete friend requests"
ON public.friends
FOR DELETE
TO authenticated
USING (
  auth.uid() = requester_id OR 
  auth.uid() = addressee_id
);

-- RLS Policy: Admins can view all friend relationships
CREATE POLICY "Admins can view all friend relationships"
ON public.friends
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_friends_updated_at
BEFORE UPDATE ON public.friends
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create a readable view for friends with profile information
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