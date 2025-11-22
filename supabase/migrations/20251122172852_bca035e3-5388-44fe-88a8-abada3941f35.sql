-- Create function to get friend activities (respecting privacy settings)
CREATE OR REPLACE FUNCTION public.get_friend_activities(_viewer_id uuid, _limit integer DEFAULT 20, _offset integer DEFAULT 0)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  username text,
  full_name text,
  avatar_url text,
  activity_type text,
  activity_data jsonb,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH friend_ids AS (
    SELECT 
      CASE 
        WHEN requester_id = _viewer_id THEN addressee_id
        ELSE requester_id
      END as friend_id
    FROM public.friends
    WHERE status = 'accepted'
      AND (requester_id = _viewer_id OR addressee_id = _viewer_id)
  ),
  activities AS (
    -- Habit completions
    SELECT 
      hc.id,
      hc.user_id,
      p.username,
      p.full_name,
      p.avatar_url,
      'habit_completion' as activity_type,
      jsonb_build_object(
        'habit_name', h.name,
        'habit_color', h.color,
        'date', hc.date,
        'completed', hc.completed
      ) as activity_data,
      hc.created_at
    FROM public.habit_completions hc
    JOIN public.habits h ON hc.habit_id = h.id
    JOIN public.profiles p ON hc.user_id = p.id
    JOIN friend_ids fi ON hc.user_id = fi.friend_id
    WHERE hc.completed = true
      AND public.can_view_habits(_viewer_id, hc.user_id)
      AND hc.created_at >= NOW() - INTERVAL '7 days'
    
    UNION ALL
    
    -- Performance scores
    SELECT 
      ps.id,
      ps.user_id,
      p.username,
      p.full_name,
      p.avatar_url,
      'performance_score' as activity_type,
      jsonb_build_object(
        'habit_name', ph.name,
        'habit_color', ph.color,
        'score', ps.score,
        'date', ps.date
      ) as activity_data,
      ps.created_at
    FROM public.performance_scores ps
    JOIN public.performance_habits ph ON ps.performance_habit_id = ph.id
    JOIN public.profiles p ON ps.user_id = p.id
    JOIN friend_ids fi ON ps.user_id = fi.friend_id
    WHERE public.can_view_performance(_viewer_id, ps.user_id)
      AND ps.created_at >= NOW() - INTERVAL '7 days'
    
    UNION ALL
    
    -- Sleep entries
    SELECT 
      se.id,
      se.user_id,
      p.username,
      p.full_name,
      p.avatar_url,
      'sleep_entry' as activity_type,
      jsonb_build_object(
        'hours_slept', se.hours_slept,
        'sleep_quality', se.sleep_quality,
        'mood', se.mood,
        'date', se.date
      ) as activity_data,
      se.created_at
    FROM public.sleep_entries se
    JOIN public.profiles p ON se.user_id = p.id
    JOIN friend_ids fi ON se.user_id = fi.friend_id
    WHERE public.can_view_sleep(_viewer_id, se.user_id)
      AND se.created_at >= NOW() - INTERVAL '7 days'
  )
  SELECT * FROM activities
  ORDER BY created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_friend_activities TO authenticated;