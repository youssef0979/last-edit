-- Make the avatars bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'avatars';