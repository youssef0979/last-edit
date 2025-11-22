-- Allow authenticated users to view basic profile info for searching users
CREATE POLICY "Users can view other users' basic profile info"
ON profiles
FOR SELECT
TO authenticated
USING (true);