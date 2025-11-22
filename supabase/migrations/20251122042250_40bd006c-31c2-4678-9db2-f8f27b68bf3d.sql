-- Create readable views for better data understanding

-- Calendar notes with username
CREATE OR REPLACE VIEW calendar_notes_readable AS
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

-- Habit completions with habit name and username
CREATE OR REPLACE VIEW habit_completions_readable AS
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

-- Habit cycles with username
CREATE OR REPLACE VIEW habit_cycles_readable AS
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

-- Habit notes with username
CREATE OR REPLACE VIEW habit_notes_readable AS
SELECT 
  hn.id,
  hn.date,
  hn.note,
  p.username,
  p.full_name,
  hn.created_at
FROM habit_notes hn
LEFT JOIN profiles p ON hn.user_id = p.id;

-- Habits with username
CREATE OR REPLACE VIEW habits_readable AS
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

-- Performance cycles with username
CREATE OR REPLACE VIEW performance_cycles_readable AS
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

-- Performance habits with username
CREATE OR REPLACE VIEW performance_habits_readable AS
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

-- Performance scores with habit name and username
CREATE OR REPLACE VIEW performance_scores_readable AS
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

-- Sleep cycles with username
CREATE OR REPLACE VIEW sleep_cycles_readable AS
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

-- Sleep entries with username
CREATE OR REPLACE VIEW sleep_entries_readable AS
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