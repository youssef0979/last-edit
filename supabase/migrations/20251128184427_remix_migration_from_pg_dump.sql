CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: friend_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.friend_status AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'blocked'
);


--
-- Name: session_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.session_status AS ENUM (
    'planned',
    'completed',
    'skipped'
);


--
-- Name: weight_unit; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.weight_unit AS ENUM (
    'kg',
    'lbs'
);


--
-- Name: are_friends(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.are_friends(_user_id_1 uuid, _user_id_2 uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.friends
    WHERE status = 'accepted'
      AND (
        (requester_id = _user_id_1 AND addressee_id = _user_id_2)
        OR
        (requester_id = _user_id_2 AND addressee_id = _user_id_1)
      )
  )
$$;


--
-- Name: can_view_calendar(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_calendar(_viewer_id uuid, _owner_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    CASE 
      WHEN _viewer_id = _owner_id THEN true
      WHEN has_role(_viewer_id, 'admin'::app_role) THEN true
      ELSE (
        SELECT COALESCE(ps.show_calendar, false)
        FROM public.privacy_settings ps
        WHERE ps.user_id = _owner_id
      ) AND public.are_friends(_viewer_id, _owner_id)
    END
$$;


--
-- Name: can_view_habits(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_habits(_viewer_id uuid, _owner_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    CASE 
      WHEN _viewer_id = _owner_id THEN true
      WHEN has_role(_viewer_id, 'admin'::app_role) THEN true
      ELSE (
        SELECT COALESCE(ps.show_habits, false)
        FROM public.privacy_settings ps
        WHERE ps.user_id = _owner_id
      ) AND public.are_friends(_viewer_id, _owner_id)
    END
$$;


--
-- Name: can_view_performance(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_performance(_viewer_id uuid, _owner_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    CASE 
      WHEN _viewer_id = _owner_id THEN true
      WHEN has_role(_viewer_id, 'admin'::app_role) THEN true
      ELSE (
        SELECT COALESCE(ps.show_performance, false)
        FROM public.privacy_settings ps
        WHERE ps.user_id = _owner_id
      ) AND public.are_friends(_viewer_id, _owner_id)
    END
$$;


--
-- Name: can_view_sleep(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_sleep(_viewer_id uuid, _owner_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    CASE 
      WHEN _viewer_id = _owner_id THEN true
      WHEN has_role(_viewer_id, 'admin'::app_role) THEN true
      ELSE (
        SELECT COALESCE(ps.show_sleep, false)
        FROM public.privacy_settings ps
        WHERE ps.user_id = _owner_id
      ) AND public.are_friends(_viewer_id, _owner_id)
    END
$$;


--
-- Name: get_friend_activities(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_friend_activities(_viewer_id uuid, _limit integer DEFAULT 20, _offset integer DEFAULT 0) RETURNS TABLE(id uuid, user_id uuid, username text, full_name text, avatar_url text, activity_type text, activity_data jsonb, created_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username'
  );
  RETURN new;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_notes_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_notes_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_time_blocks_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_time_blocks_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: admin_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid NOT NULL,
    action_type text NOT NULL,
    target_user_id uuid,
    target_table text,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: calendar_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    title text NOT NULL,
    content text,
    color text DEFAULT '#3b82f6'::text,
    reminder_time timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    bio text,
    username text,
    CONSTRAINT username_format CHECK ((username ~ '^[a-zA-Z0-9_-]{3,20}$'::text))
);


--
-- Name: calendar_notes_readable; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.calendar_notes_readable WITH (security_invoker='true') AS
 SELECT cn.id,
    cn.date,
    cn.title,
    cn.content,
    cn.color,
    cn.reminder_time,
    p.username,
    p.full_name,
    cn.created_at
   FROM (public.calendar_notes cn
     LEFT JOIN public.profiles p ON ((cn.user_id = p.id)));


--
-- Name: exercise_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercise_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: exercise_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercise_stats (
    exercise_id uuid NOT NULL,
    last_best_set_value numeric,
    estimated_1rm numeric,
    total_volume numeric,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: exercises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercises (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    folder_id uuid,
    name text NOT NULL,
    primary_muscle text,
    unit public.weight_unit DEFAULT 'kg'::public.weight_unit NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: friends; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friends (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requester_id uuid NOT NULL,
    addressee_id uuid NOT NULL,
    status public.friend_status DEFAULT 'pending'::public.friend_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT no_self_friend CHECK ((requester_id <> addressee_id))
);


--
-- Name: friends_readable; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.friends_readable WITH (security_invoker='true') AS
 SELECT f.id,
    f.requester_id,
    f.addressee_id,
    f.status,
    f.created_at,
    f.updated_at,
    p1.username AS requester_username,
    p1.full_name AS requester_full_name,
    p1.avatar_url AS requester_avatar_url,
    p2.username AS addressee_username,
    p2.full_name AS addressee_full_name,
    p2.avatar_url AS addressee_avatar_url
   FROM ((public.friends f
     JOIN public.profiles p1 ON ((f.requester_id = p1.id)))
     JOIN public.profiles p2 ON ((f.addressee_id = p2.id)));


--
-- Name: gym_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gym_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_index integer NOT NULL,
    scheduled_date timestamp with time zone,
    status public.session_status DEFAULT 'planned'::public.session_status NOT NULL,
    preset_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: habit_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.habit_completions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    habit_id uuid NOT NULL,
    date date NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: habits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.habits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    color text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    difficulty_weight integer DEFAULT 1,
    priority text DEFAULT 'medium'::text,
    is_preloaded boolean DEFAULT false,
    CONSTRAINT habits_difficulty_weight_check CHECK (((difficulty_weight >= 1) AND (difficulty_weight <= 3))),
    CONSTRAINT habits_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])))
);


--
-- Name: habit_completions_readable; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.habit_completions_readable WITH (security_invoker='true') AS
 SELECT hc.id,
    hc.date,
    hc.completed,
    h.name AS habit_name,
    h.color AS habit_color,
    p.username,
    p.full_name,
    hc.created_at
   FROM ((public.habit_completions hc
     LEFT JOIN public.habits h ON ((hc.habit_id = h.id)))
     LEFT JOIN public.profiles p ON ((hc.user_id = p.id)));


--
-- Name: habit_cycles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.habit_cycles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: habit_cycles_readable; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.habit_cycles_readable WITH (security_invoker='true') AS
 SELECT hcy.id,
    hcy.start_date,
    hcy.end_date,
    hcy.is_current,
    p.username,
    p.full_name,
    hcy.created_at
   FROM (public.habit_cycles hcy
     LEFT JOIN public.profiles p ON ((hcy.user_id = p.id)));


--
-- Name: habit_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.habit_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: habit_notes_readable; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.habit_notes_readable WITH (security_invoker='true') AS
 SELECT hn.id,
    hn.date,
    hn.note,
    p.username,
    p.full_name,
    hn.created_at
   FROM (public.habit_notes hn
     LEFT JOIN public.profiles p ON ((hn.user_id = p.id)));


--
-- Name: habits_readable; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.habits_readable WITH (security_invoker='true') AS
 SELECT h.id,
    h.name,
    h.color,
    h.is_active,
    h.difficulty_weight,
    h.priority,
    h.is_preloaded,
    p.username,
    p.full_name,
    h.created_at
   FROM (public.habits h
     LEFT JOIN public.profiles p ON ((h.user_id = p.id)));


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text,
    body text,
    checklist jsonb,
    color text DEFAULT '#ffffff'::text NOT NULL,
    icon text,
    tags text[] DEFAULT '{}'::text[],
    is_pinned boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: performance_cycles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.performance_cycles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: performance_cycles_readable; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.performance_cycles_readable WITH (security_invoker='true') AS
 SELECT pc.id,
    pc.start_date,
    pc.end_date,
    pc.is_current,
    p.username,
    p.full_name,
    pc.created_at
   FROM (public.performance_cycles pc
     LEFT JOIN public.profiles p ON ((pc.user_id = p.id)));


--
-- Name: performance_habits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.performance_habits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    color text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: performance_habits_readable; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.performance_habits_readable WITH (security_invoker='true') AS
 SELECT ph.id,
    ph.name,
    ph.color,
    ph.is_active,
    p.username,
    p.full_name,
    ph.created_at
   FROM (public.performance_habits ph
     LEFT JOIN public.profiles p ON ((ph.user_id = p.id)));


--
-- Name: performance_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.performance_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    performance_habit_id uuid NOT NULL,
    date date NOT NULL,
    score integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT performance_scores_score_check CHECK (((score >= 1) AND (score <= 10)))
);


--
-- Name: performance_scores_readable; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.performance_scores_readable WITH (security_invoker='true') AS
 SELECT ps.id,
    ps.date,
    ps.score,
    ph.name AS habit_name,
    ph.color AS habit_color,
    p.username,
    p.full_name,
    ps.created_at
   FROM ((public.performance_scores ps
     LEFT JOIN public.performance_habits ph ON ((ps.performance_habit_id = ph.id)))
     LEFT JOIN public.profiles p ON ((ps.user_id = p.id)));


--
-- Name: pomodoro_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pomodoro_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_type text NOT NULL,
    preset_name text NOT NULL,
    duration_minutes integer NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    session_name text,
    cover_image_url text,
    status text DEFAULT 'completed'::text NOT NULL,
    timer_mode text DEFAULT 'normal'::text,
    work_segments integer DEFAULT 0,
    break_segments integer DEFAULT 0,
    linked_performance_habit_id uuid,
    CONSTRAINT pomodoro_sessions_session_type_check CHECK ((session_type = ANY (ARRAY['work'::text, 'break'::text]))),
    CONSTRAINT pomodoro_sessions_status_check CHECK ((status = ANY (ARRAY['completed'::text, 'ongoing'::text, 'abandoned'::text]))),
    CONSTRAINT pomodoro_sessions_timer_mode_check CHECK ((timer_mode = ANY (ARRAY['normal'::text, 'focus'::text, 'silent'::text])))
);


--
-- Name: privacy_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.privacy_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    show_performance boolean DEFAULT true NOT NULL,
    show_habits boolean DEFAULT true NOT NULL,
    show_sleep boolean DEFAULT true NOT NULL,
    show_calendar boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: set_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.set_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    exercise_id uuid NOT NULL,
    set_number integer NOT NULL,
    weight numeric NOT NULL,
    reps integer NOT NULL,
    unit public.weight_unit NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sleep_cycles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sleep_cycles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sleep_cycles_readable; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.sleep_cycles_readable WITH (security_invoker='true') AS
 SELECT sc.id,
    sc.start_date,
    sc.end_date,
    sc.is_current,
    p.username,
    p.full_name,
    sc.created_at
   FROM (public.sleep_cycles sc
     LEFT JOIN public.profiles p ON ((sc.user_id = p.id)));


--
-- Name: sleep_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sleep_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    hours_slept numeric(4,2) NOT NULL,
    mood text NOT NULL,
    sleep_quality integer,
    bedtime time without time zone,
    wake_time time without time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sleep_entries_mood_check CHECK ((mood = ANY (ARRAY['happy'::text, 'neutral'::text, 'sad'::text]))),
    CONSTRAINT sleep_entries_sleep_quality_check CHECK (((sleep_quality >= 1) AND (sleep_quality <= 10)))
);


--
-- Name: sleep_entries_readable; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.sleep_entries_readable WITH (security_invoker='true') AS
 SELECT se.id,
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
   FROM (public.sleep_entries se
     LEFT JOIN public.profiles p ON ((se.user_id = p.id)));


--
-- Name: time_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    title text NOT NULL,
    description text,
    color text DEFAULT '#3b82f6'::text NOT NULL,
    icon text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    note_id uuid
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_actions admin_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_pkey PRIMARY KEY (id);


--
-- Name: calendar_notes calendar_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_notes
    ADD CONSTRAINT calendar_notes_pkey PRIMARY KEY (id);


--
-- Name: calendar_notes calendar_notes_user_id_date_title_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_notes
    ADD CONSTRAINT calendar_notes_user_id_date_title_key UNIQUE (user_id, date, title);


--
-- Name: exercise_folders exercise_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_folders
    ADD CONSTRAINT exercise_folders_pkey PRIMARY KEY (id);


--
-- Name: exercise_stats exercise_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_stats
    ADD CONSTRAINT exercise_stats_pkey PRIMARY KEY (exercise_id);


--
-- Name: exercises exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_pkey PRIMARY KEY (id);


--
-- Name: friends friends_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_pkey PRIMARY KEY (id);


--
-- Name: gym_sessions gym_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gym_sessions
    ADD CONSTRAINT gym_sessions_pkey PRIMARY KEY (id);


--
-- Name: gym_sessions gym_sessions_user_id_session_index_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gym_sessions
    ADD CONSTRAINT gym_sessions_user_id_session_index_key UNIQUE (user_id, session_index);


--
-- Name: habit_completions habit_completions_habit_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_completions
    ADD CONSTRAINT habit_completions_habit_id_date_key UNIQUE (habit_id, date);


--
-- Name: habit_completions habit_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_completions
    ADD CONSTRAINT habit_completions_pkey PRIMARY KEY (id);


--
-- Name: habit_cycles habit_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_cycles
    ADD CONSTRAINT habit_cycles_pkey PRIMARY KEY (id);


--
-- Name: habit_notes habit_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_notes
    ADD CONSTRAINT habit_notes_pkey PRIMARY KEY (id);


--
-- Name: habit_notes habit_notes_user_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_notes
    ADD CONSTRAINT habit_notes_user_id_date_key UNIQUE (user_id, date);


--
-- Name: habits habits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: performance_cycles performance_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_cycles
    ADD CONSTRAINT performance_cycles_pkey PRIMARY KEY (id);


--
-- Name: performance_habits performance_habits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_habits
    ADD CONSTRAINT performance_habits_pkey PRIMARY KEY (id);


--
-- Name: performance_scores performance_scores_habit_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_scores
    ADD CONSTRAINT performance_scores_habit_id_date_key UNIQUE (performance_habit_id, date);


--
-- Name: performance_scores performance_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_scores
    ADD CONSTRAINT performance_scores_pkey PRIMARY KEY (id);


--
-- Name: pomodoro_sessions pomodoro_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pomodoro_sessions
    ADD CONSTRAINT pomodoro_sessions_pkey PRIMARY KEY (id);


--
-- Name: privacy_settings privacy_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.privacy_settings
    ADD CONSTRAINT privacy_settings_pkey PRIMARY KEY (id);


--
-- Name: privacy_settings privacy_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.privacy_settings
    ADD CONSTRAINT privacy_settings_user_id_key UNIQUE (user_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: set_entries set_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.set_entries
    ADD CONSTRAINT set_entries_pkey PRIMARY KEY (id);


--
-- Name: sleep_cycles sleep_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sleep_cycles
    ADD CONSTRAINT sleep_cycles_pkey PRIMARY KEY (id);


--
-- Name: sleep_entries sleep_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sleep_entries
    ADD CONSTRAINT sleep_entries_pkey PRIMARY KEY (id);


--
-- Name: sleep_entries sleep_entries_user_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sleep_entries
    ADD CONSTRAINT sleep_entries_user_id_date_key UNIQUE (user_id, date);


--
-- Name: time_blocks time_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_blocks
    ADD CONSTRAINT time_blocks_pkey PRIMARY KEY (id);


--
-- Name: friends unique_friendship; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_admin_actions_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions USING btree (admin_id);


--
-- Name: idx_admin_actions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_created_at ON public.admin_actions USING btree (created_at DESC);


--
-- Name: idx_admin_actions_target_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_target_user_id ON public.admin_actions USING btree (target_user_id);


--
-- Name: idx_calendar_notes_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_notes_date ON public.calendar_notes USING btree (date);


--
-- Name: idx_calendar_notes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_notes_user_id ON public.calendar_notes USING btree (user_id);


--
-- Name: idx_exercises_user_folder; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exercises_user_folder ON public.exercises USING btree (user_id, folder_id);


--
-- Name: idx_friends_addressee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friends_addressee ON public.friends USING btree (addressee_id);


--
-- Name: idx_friends_requester; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friends_requester ON public.friends USING btree (requester_id);


--
-- Name: idx_friends_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friends_status ON public.friends USING btree (status);


--
-- Name: idx_gym_sessions_user_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gym_sessions_user_index ON public.gym_sessions USING btree (user_id, session_index DESC);


--
-- Name: idx_habit_completions_habit_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_habit_completions_habit_date ON public.habit_completions USING btree (habit_id, date);


--
-- Name: idx_habit_completions_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_habit_completions_user_date ON public.habit_completions USING btree (user_id, date);


--
-- Name: idx_habit_cycles_user_current; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_habit_cycles_user_current ON public.habit_cycles USING btree (user_id, is_current);


--
-- Name: idx_habit_notes_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_habit_notes_user_date ON public.habit_notes USING btree (user_id, date);


--
-- Name: idx_habits_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_habits_user_id ON public.habits USING btree (user_id);


--
-- Name: idx_notes_pinned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_pinned ON public.notes USING btree (user_id, is_pinned, updated_at DESC);


--
-- Name: idx_notes_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_search ON public.notes USING gin (to_tsvector('english'::regconfig, ((COALESCE(title, ''::text) || ' '::text) || COALESCE(body, ''::text))));


--
-- Name: idx_notes_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_tags ON public.notes USING gin (tags);


--
-- Name: idx_performance_cycles_current; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_performance_cycles_current ON public.performance_cycles USING btree (is_current) WHERE (is_current = true);


--
-- Name: idx_performance_cycles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_performance_cycles_user_id ON public.performance_cycles USING btree (user_id);


--
-- Name: idx_performance_habits_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_performance_habits_user_id ON public.performance_habits USING btree (user_id);


--
-- Name: idx_performance_scores_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_performance_scores_date ON public.performance_scores USING btree (date);


--
-- Name: idx_performance_scores_habit_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_performance_scores_habit_id ON public.performance_scores USING btree (performance_habit_id);


--
-- Name: idx_performance_scores_performance_habit_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_performance_scores_performance_habit_id ON public.performance_scores USING btree (performance_habit_id);


--
-- Name: idx_performance_scores_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_performance_scores_user_id ON public.performance_scores USING btree (user_id);


--
-- Name: idx_pomodoro_sessions_performance_habit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pomodoro_sessions_performance_habit ON public.pomodoro_sessions USING btree (linked_performance_habit_id);


--
-- Name: idx_pomodoro_sessions_user_id_completed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pomodoro_sessions_user_id_completed_at ON public.pomodoro_sessions USING btree (user_id, completed_at DESC);


--
-- Name: idx_profiles_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_username ON public.profiles USING btree (username);


--
-- Name: idx_set_entries_exercise; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_set_entries_exercise ON public.set_entries USING btree (exercise_id);


--
-- Name: idx_set_entries_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_set_entries_session ON public.set_entries USING btree (session_id);


--
-- Name: idx_sleep_cycles_current; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sleep_cycles_current ON public.sleep_cycles USING btree (user_id, is_current);


--
-- Name: idx_sleep_cycles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sleep_cycles_user_id ON public.sleep_cycles USING btree (user_id);


--
-- Name: idx_sleep_entries_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sleep_entries_date ON public.sleep_entries USING btree (date);


--
-- Name: idx_sleep_entries_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sleep_entries_user_id ON public.sleep_entries USING btree (user_id);


--
-- Name: idx_time_blocks_note_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_time_blocks_note_id ON public.time_blocks USING btree (note_id);


--
-- Name: profiles on_profile_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_profile_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: calendar_notes update_calendar_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_calendar_notes_updated_at BEFORE UPDATE ON public.calendar_notes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: exercise_folders update_exercise_folders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_exercise_folders_updated_at BEFORE UPDATE ON public.exercise_folders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: friends update_friends_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON public.friends FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: gym_sessions update_gym_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_gym_sessions_updated_at BEFORE UPDATE ON public.gym_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: notes update_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_notes_updated_at();


--
-- Name: privacy_settings update_privacy_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_privacy_settings_updated_at BEFORE UPDATE ON public.privacy_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: time_blocks update_time_blocks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_time_blocks_updated_at BEFORE UPDATE ON public.time_blocks FOR EACH ROW EXECUTE FUNCTION public.update_time_blocks_updated_at();


--
-- Name: exercise_folders exercise_folders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_folders
    ADD CONSTRAINT exercise_folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: exercise_stats exercise_stats_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_stats
    ADD CONSTRAINT exercise_stats_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;


--
-- Name: exercises exercises_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.exercise_folders(id) ON DELETE SET NULL;


--
-- Name: exercises exercises_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: friends friends_addressee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_addressee_id_fkey FOREIGN KEY (addressee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: friends friends_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: gym_sessions gym_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gym_sessions
    ADD CONSTRAINT gym_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: habit_completions habit_completions_habit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_completions
    ADD CONSTRAINT habit_completions_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES public.habits(id) ON DELETE CASCADE;


--
-- Name: habits habits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: performance_cycles performance_cycles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_cycles
    ADD CONSTRAINT performance_cycles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: performance_scores performance_scores_performance_habit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_scores
    ADD CONSTRAINT performance_scores_performance_habit_id_fkey FOREIGN KEY (performance_habit_id) REFERENCES public.performance_habits(id) ON DELETE CASCADE;


--
-- Name: performance_scores performance_scores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_scores
    ADD CONSTRAINT performance_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: pomodoro_sessions pomodoro_sessions_linked_performance_habit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pomodoro_sessions
    ADD CONSTRAINT pomodoro_sessions_linked_performance_habit_id_fkey FOREIGN KEY (linked_performance_habit_id) REFERENCES public.performance_habits(id) ON DELETE SET NULL;


--
-- Name: privacy_settings privacy_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.privacy_settings
    ADD CONSTRAINT privacy_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: set_entries set_entries_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.set_entries
    ADD CONSTRAINT set_entries_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;


--
-- Name: set_entries set_entries_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.set_entries
    ADD CONSTRAINT set_entries_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.gym_sessions(id) ON DELETE CASCADE;


--
-- Name: time_blocks time_blocks_note_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_blocks
    ADD CONSTRAINT time_blocks_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_actions Admins can insert action logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert action logs" ON public.admin_actions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_actions Admins can view all action logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all action logs" ON public.admin_actions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: calendar_notes Admins can view all calendar notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all calendar notes" ON public.calendar_notes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: friends Admins can view all friend relationships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all friend relationships" ON public.friends FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: habit_completions Admins can view all habit completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all habit completions" ON public.habit_completions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: habit_notes Admins can view all habit notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all habit notes" ON public.habit_notes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: habits Admins can view all habits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all habits" ON public.habits FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: performance_habits Admins can view all performance habits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all performance habits" ON public.performance_habits FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: performance_scores Admins can view all performance scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all performance scores" ON public.performance_scores FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: pomodoro_sessions Admins can view all pomodoro sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all pomodoro sessions" ON public.pomodoro_sessions FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: privacy_settings Admins can view all privacy settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all privacy settings" ON public.privacy_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: sleep_entries Admins can view all sleep entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all sleep entries" ON public.sleep_entries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: calendar_notes Friends can view calendar notes if allowed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Friends can view calendar notes if allowed" ON public.calendar_notes FOR SELECT TO authenticated USING (public.can_view_calendar(auth.uid(), user_id));


--
-- Name: habit_completions Friends can view habit completions if allowed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Friends can view habit completions if allowed" ON public.habit_completions FOR SELECT TO authenticated USING (public.can_view_habits(auth.uid(), user_id));


--
-- Name: habit_notes Friends can view habit notes if allowed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Friends can view habit notes if allowed" ON public.habit_notes FOR SELECT TO authenticated USING (public.can_view_habits(auth.uid(), user_id));


--
-- Name: habits Friends can view habits if allowed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Friends can view habits if allowed" ON public.habits FOR SELECT TO authenticated USING (public.can_view_habits(auth.uid(), user_id));


--
-- Name: performance_habits Friends can view performance habits if allowed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Friends can view performance habits if allowed" ON public.performance_habits FOR SELECT TO authenticated USING (public.can_view_performance(auth.uid(), user_id));


--
-- Name: performance_scores Friends can view performance scores if allowed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Friends can view performance scores if allowed" ON public.performance_scores FOR SELECT TO authenticated USING (public.can_view_performance(auth.uid(), user_id));


--
-- Name: sleep_entries Friends can view sleep entries if allowed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Friends can view sleep entries if allowed" ON public.sleep_entries FOR SELECT TO authenticated USING (public.can_view_sleep(auth.uid(), user_id));


--
-- Name: calendar_notes Users can create their own calendar notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own calendar notes" ON public.calendar_notes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: habit_completions Users can create their own completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own completions" ON public.habit_completions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: habit_cycles Users can create their own cycles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own cycles" ON public.habit_cycles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: performance_cycles Users can create their own cycles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own cycles" ON public.performance_cycles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: exercises Users can create their own exercises; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own exercises" ON public.exercises FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: exercise_folders Users can create their own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own folders" ON public.exercise_folders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: habits Users can create their own habits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own habits" ON public.habits FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: habit_notes Users can create their own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own notes" ON public.habit_notes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: notes Users can create their own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own notes" ON public.notes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: performance_habits Users can create their own performance habits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own performance habits" ON public.performance_habits FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: pomodoro_sessions Users can create their own pomodoro sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own pomodoro sessions" ON public.pomodoro_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: performance_scores Users can create their own scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own scores" ON public.performance_scores FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: gym_sessions Users can create their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own sessions" ON public.gym_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: set_entries Users can create their own set entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own set entries" ON public.set_entries FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.gym_sessions
  WHERE ((gym_sessions.id = set_entries.session_id) AND (gym_sessions.user_id = auth.uid())))));


--
-- Name: sleep_cycles Users can create their own sleep cycles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own sleep cycles" ON public.sleep_cycles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: sleep_entries Users can create their own sleep entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own sleep entries" ON public.sleep_entries FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: time_blocks Users can create their own time blocks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own time blocks" ON public.time_blocks FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: friends Users can delete friend requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete friend requests" ON public.friends FOR DELETE TO authenticated USING (((auth.uid() = requester_id) OR (auth.uid() = addressee_id)));


--
-- Name: calendar_notes Users can delete their own calendar notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own calendar notes" ON public.calendar_notes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: habit_completions Users can delete their own completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own completions" ON public.habit_completions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: exercises Users can delete their own exercises; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own exercises" ON public.exercises FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: exercise_folders Users can delete their own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own folders" ON public.exercise_folders FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: habits Users can delete their own habits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own habits" ON public.habits FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: habit_notes Users can delete their own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own notes" ON public.habit_notes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: notes Users can delete their own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own notes" ON public.notes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: performance_habits Users can delete their own performance habits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own performance habits" ON public.performance_habits FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: pomodoro_sessions Users can delete their own pomodoro sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own pomodoro sessions" ON public.pomodoro_sessions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: performance_scores Users can delete their own scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own scores" ON public.performance_scores FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: gym_sessions Users can delete their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own sessions" ON public.gym_sessions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: set_entries Users can delete their own set entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own set entries" ON public.set_entries FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.gym_sessions
  WHERE ((gym_sessions.id = set_entries.session_id) AND (gym_sessions.user_id = auth.uid())))));


--
-- Name: sleep_entries Users can delete their own sleep entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own sleep entries" ON public.sleep_entries FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: time_blocks Users can delete their own time blocks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own time blocks" ON public.time_blocks FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: privacy_settings Users can insert their own privacy settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own privacy settings" ON public.privacy_settings FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: friends Users can send friend requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send friend requests" ON public.friends FOR INSERT TO authenticated WITH CHECK (((auth.uid() = requester_id) AND (status = 'pending'::public.friend_status)));


--
-- Name: friends Users can update their friend requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their friend requests" ON public.friends FOR UPDATE TO authenticated USING (((auth.uid() = requester_id) OR (auth.uid() = addressee_id)));


--
-- Name: calendar_notes Users can update their own calendar notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own calendar notes" ON public.calendar_notes FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: habit_completions Users can update their own completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own completions" ON public.habit_completions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: habit_cycles Users can update their own cycles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own cycles" ON public.habit_cycles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: performance_cycles Users can update their own cycles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own cycles" ON public.performance_cycles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: exercises Users can update their own exercises; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own exercises" ON public.exercises FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: exercise_folders Users can update their own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own folders" ON public.exercise_folders FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: habits Users can update their own habits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own habits" ON public.habits FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: habit_notes Users can update their own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notes" ON public.habit_notes FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: notes Users can update their own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notes" ON public.notes FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: performance_habits Users can update their own performance habits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own performance habits" ON public.performance_habits FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: privacy_settings Users can update their own privacy settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own privacy settings" ON public.privacy_settings FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: performance_scores Users can update their own scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own scores" ON public.performance_scores FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: gym_sessions Users can update their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own sessions" ON public.gym_sessions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: sleep_cycles Users can update their own sleep cycles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own sleep cycles" ON public.sleep_cycles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: sleep_entries Users can update their own sleep entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own sleep entries" ON public.sleep_entries FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: time_blocks Users can update their own time blocks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own time blocks" ON public.time_blocks FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view other users' basic profile info; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view other users' basic profile info" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: calendar_notes Users can view their own calendar notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own calendar notes" ON public.calendar_notes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: habit_completions Users can view their own completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own completions" ON public.habit_completions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: habit_cycles Users can view their own cycles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own cycles" ON public.habit_cycles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: performance_cycles Users can view their own cycles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own cycles" ON public.performance_cycles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: exercise_stats Users can view their own exercise stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own exercise stats" ON public.exercise_stats FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.exercises
  WHERE ((exercises.id = exercise_stats.exercise_id) AND (exercises.user_id = auth.uid())))));


--
-- Name: exercises Users can view their own exercises; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own exercises" ON public.exercises FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: exercise_folders Users can view their own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own folders" ON public.exercise_folders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: friends Users can view their own friend relationships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own friend relationships" ON public.friends FOR SELECT TO authenticated USING (((auth.uid() = requester_id) OR (auth.uid() = addressee_id)));


--
-- Name: habits Users can view their own habits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own habits" ON public.habits FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: habit_notes Users can view their own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notes" ON public.habit_notes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notes Users can view their own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notes" ON public.notes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: performance_habits Users can view their own performance habits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own performance habits" ON public.performance_habits FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: pomodoro_sessions Users can view their own pomodoro sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own pomodoro sessions" ON public.pomodoro_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: privacy_settings Users can view their own privacy settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own privacy settings" ON public.privacy_settings FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: performance_scores Users can view their own scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own scores" ON public.performance_scores FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: gym_sessions Users can view their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own sessions" ON public.gym_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: set_entries Users can view their own set entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own set entries" ON public.set_entries FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.gym_sessions
  WHERE ((gym_sessions.id = set_entries.session_id) AND (gym_sessions.user_id = auth.uid())))));


--
-- Name: sleep_cycles Users can view their own sleep cycles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own sleep cycles" ON public.sleep_cycles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: sleep_entries Users can view their own sleep entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own sleep entries" ON public.sleep_entries FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: time_blocks Users can view their own time blocks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own time blocks" ON public.time_blocks FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: admin_actions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

--
-- Name: calendar_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: exercise_folders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exercise_folders ENABLE ROW LEVEL SECURITY;

--
-- Name: exercise_stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exercise_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: exercises; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

--
-- Name: friends; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

--
-- Name: gym_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gym_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: habit_completions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

--
-- Name: habit_cycles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.habit_cycles ENABLE ROW LEVEL SECURITY;

--
-- Name: habit_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.habit_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: habits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

--
-- Name: notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

--
-- Name: performance_cycles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.performance_cycles ENABLE ROW LEVEL SECURITY;

--
-- Name: performance_habits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.performance_habits ENABLE ROW LEVEL SECURITY;

--
-- Name: performance_scores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.performance_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: pomodoro_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: privacy_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: set_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.set_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: sleep_cycles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sleep_cycles ENABLE ROW LEVEL SECURITY;

--
-- Name: sleep_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sleep_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: time_blocks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


