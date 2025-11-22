-- Make avatars bucket public so avatar images can be displayed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';