-- Insert first admin user (migrations bypass RLS)
INSERT INTO public.user_roles (user_id, role)
VALUES ('8d2bde5d-14c4-4185-890a-a3cb12adaa2b', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;