-- Add advanced session tracking fields to pomodoro_sessions
ALTER TABLE pomodoro_sessions 
ADD COLUMN timer_mode text DEFAULT 'normal' CHECK (timer_mode IN ('normal', 'focus', 'silent')),
ADD COLUMN work_segments integer DEFAULT 0,
ADD COLUMN break_segments integer DEFAULT 0,
ADD COLUMN linked_performance_habit_id uuid REFERENCES performance_habits(id) ON DELETE SET NULL;

-- Create index for performance habit lookups
CREATE INDEX idx_pomodoro_sessions_performance_habit 
ON pomodoro_sessions(linked_performance_habit_id);

-- Add comment explaining timer modes
COMMENT ON COLUMN pomodoro_sessions.timer_mode IS 'Timer mode: normal (default), focus (minimal distractions), silent (no audio notifications)';

-- Add comment explaining session segments
COMMENT ON COLUMN pomodoro_sessions.work_segments IS 'Number of completed work segments in this session';
COMMENT ON COLUMN pomodoro_sessions.break_segments IS 'Number of completed break segments in this session';