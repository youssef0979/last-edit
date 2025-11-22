-- Fix security definer views by recreating them with security invoker
-- This ensures views respect RLS policies of the querying user

DROP VIEW IF EXISTS calendar_notes_readable;
DROP VIEW IF EXISTS habit_completions_readable;
DROP VIEW IF EXISTS habit_cycles_readable;
DROP VIEW IF EXISTS habit_notes_readable;
DROP VIEW IF EXISTS habits_readable;
DROP VIEW IF EXISTS performance_cycles_readable;
DROP VIEW IF EXISTS performance_habits_readable;
DROP VIEW IF EXISTS performance_scores_readable;
DROP VIEW IF EXISTS sleep_cycles_readable;
DROP VIEW IF EXISTS sleep_entries_readable;

-- Calendar notes with username (SECURITY INVOKER)
CREATE VIEW calendar_notes_readable
WITH (security_invoker = true)
AS
SELECT 
  cn.id,
  cn.date,
  cn.title,
  cn.content,
  cn.color,
  cn.reminder_time,
  p.username,
  p.full_name,
  cn.created_at
FROM calendar_notes cn
LEFT JOIN profiles p ON cn.user_id = p.id;

-- Habit completions with habit name and username (SECURITY INVOKER)
CREATE VIEW habit_completions_readable
WITH (security_invoker = true)
AS
SELECT 
  hc.id,
  hc.date,
  hc.completed,
  h.name as habit_name,
  h.color as habit_color,
  p.username,
  p.full_name,
  hc.created_at
FROM habit_completions hc
LEFT JOIN habits h ON hc.habit_id = h.id
LEFT JOIN profiles p ON hc.user_id = p.id;

-- Habit cycles with username (SECURITY INVOKER)
CREATE VIEW habit_cycles_readable
WITH (security_invoker = true)
AS
SELECT 
  hcy.id,
  hcy.start_date,
  hcy.end_date,
  hcy.is_current,
  p.username,
  p.full_name,
  hcy.created_at
FROM habit_cycles hcy
LEFT JOIN profiles p ON hcy.user_id = p.id;

-- Habit notes with username (SECURITY INVOKER)
CREATE VIEW habit_notes_readable
WITH (security_invoker = true)
AS
SELECT 
  hn.id,
  hn.date,
  hn.note,
  p.username,
  p.full_name,
  hn.created_at
FROM habit_notes hn
LEFT JOIN profiles p ON hn.user_id = p.id;

-- Habits with username (SECURITY INVOKER)
CREATE VIEW habits_readable
WITH (security_invoker = true)
AS
SELECT 
  h.id,
  h.name,
  h.color,
  h.is_active,
  h.difficulty_weight,
  h.priority,
  h.is_preloaded,
  p.username,
  p.full_name,
  h.created_at
FROM habits h
LEFT JOIN profiles p ON h.user_id = p.id;

-- Performance cycles with username (SECURITY INVOKER)
CREATE VIEW performance_cycles_readable
WITH (security_invoker = true)
AS
SELECT 
  pc.id,
  pc.start_date,
  pc.end_date,
  pc.is_current,
  p.username,
  p.full_name,
  pc.created_at
FROM performance_cycles pc
LEFT JOIN profiles p ON pc.user_id = p.id;

-- Performance habits with username (SECURITY INVOKER)
CREATE VIEW performance_habits_readable
WITH (security_invoker = true)
AS
SELECT 
  ph.id,
  ph.name,
  ph.color,
  ph.is_active,
  p.username,
  p.full_name,
  ph.created_at
FROM performance_habits ph
LEFT JOIN profiles p ON ph.user_id = p.id;

-- Performance scores with habit name and username (SECURITY INVOKER)
CREATE VIEW performance_scores_readable
WITH (security_invoker = true)
AS
SELECT 
  ps.id,
  ps.date,
  ps.score,
  ph.name as habit_name,
  ph.color as habit_color,
  p.username,
  p.full_name,
  ps.created_at
FROM performance_scores ps
LEFT JOIN performance_habits ph ON ps.performance_habit_id = ph.id
LEFT JOIN profiles p ON ps.user_id = p.id;

-- Sleep cycles with username (SECURITY INVOKER)
CREATE VIEW sleep_cycles_readable
WITH (security_invoker = true)
AS
SELECT 
  sc.id,
  sc.start_date,
  sc.end_date,
  sc.is_current,
  p.username,
  p.full_name,
  sc.created_at
FROM sleep_cycles sc
LEFT JOIN profiles p ON sc.user_id = p.id;

-- Sleep entries with username (SECURITY INVOKER)
CREATE VIEW sleep_entries_readable
WITH (security_invoker = true)
AS
SELECT 
  se.id,
  se.date,
  se.hours_slept,
  se.mood,
  se.sleep_quality,
  se.bedtime,
  se.wake_time,
  se.notes,
  p.username,
  p.full_name,
  se.created_at
FROM sleep_entries se
LEFT JOIN profiles p ON se.user_id = p.id;