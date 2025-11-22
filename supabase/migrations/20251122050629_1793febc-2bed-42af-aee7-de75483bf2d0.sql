-- Add admin policies to view all tracker data

-- Habits table - admin can view all
CREATE POLICY "Admins can view all habits"
ON public.habits
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Performance habits - admin can view all
CREATE POLICY "Admins can view all performance habits"
ON public.performance_habits
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Sleep entries - admin can view all
CREATE POLICY "Admins can view all sleep entries"
ON public.sleep_entries
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Calendar notes - admin can view all
CREATE POLICY "Admins can view all calendar notes"
ON public.calendar_notes
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Habit completions - admin can view all
CREATE POLICY "Admins can view all habit completions"
ON public.habit_completions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Performance scores - admin can view all
CREATE POLICY "Admins can view all performance scores"
ON public.performance_scores
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Habit notes - admin can view all
CREATE POLICY "Admins can view all habit notes"
ON public.habit_notes
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));