-- Add DELETE policy for pomodoro_sessions
CREATE POLICY "Users can delete their own pomodoro sessions"
ON public.pomodoro_sessions
FOR DELETE
USING (auth.uid() = user_id);