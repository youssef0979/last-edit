export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_table: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_table?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_table?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      calendar_notes: {
        Row: {
          color: string | null
          content: string | null
          created_at: string
          date: string
          id: string
          reminder_time: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          content?: string | null
          created_at?: string
          date: string
          id?: string
          reminder_time?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          content?: string | null
          created_at?: string
          date?: string
          id?: string
          reminder_time?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_folders: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_stats: {
        Row: {
          estimated_1rm: number | null
          exercise_id: string
          last_best_set_value: number | null
          total_volume: number | null
          updated_at: string
        }
        Insert: {
          estimated_1rm?: number | null
          exercise_id: string
          last_best_set_value?: number | null
          total_volume?: number | null
          updated_at?: string
        }
        Update: {
          estimated_1rm?: number | null
          exercise_id?: string
          last_best_set_value?: number | null
          total_volume?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_stats_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: true
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          name: string
          primary_muscle: string | null
          unit: Database["public"]["Enums"]["weight_unit"]
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          id?: string
          name: string
          primary_muscle?: string | null
          unit?: Database["public"]["Enums"]["weight_unit"]
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          name?: string
          primary_muscle?: string | null
          unit?: Database["public"]["Enums"]["weight_unit"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "exercise_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friend_status"]
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["friend_status"]
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friend_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_sessions: {
        Row: {
          created_at: string
          id: string
          preset_id: string | null
          scheduled_date: string | null
          session_index: number
          status: Database["public"]["Enums"]["session_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preset_id?: string | null
          scheduled_date?: string | null
          session_index: number
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preset_id?: string | null
          scheduled_date?: string | null
          session_index?: number
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits_readable"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_cycles: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_notes: {
        Row: {
          created_at: string
          date: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      habits: {
        Row: {
          color: string
          created_at: string
          difficulty_weight: number | null
          id: string
          is_active: boolean
          is_preloaded: boolean | null
          name: string
          priority: string | null
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string
          difficulty_weight?: number | null
          id?: string
          is_active?: boolean
          is_preloaded?: boolean | null
          name: string
          priority?: string | null
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          difficulty_weight?: number | null
          id?: string
          is_active?: boolean
          is_preloaded?: boolean | null
          name?: string
          priority?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          body: string | null
          checklist: Json | null
          color: string
          created_at: string
          icon: string | null
          id: string
          is_pinned: boolean
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          checklist?: Json | null
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_pinned?: boolean
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          checklist?: Json | null
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_pinned?: boolean
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_cycles: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_cycles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_habits: {
        Row: {
          color: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_scores: {
        Row: {
          created_at: string
          date: string
          id: string
          performance_habit_id: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          performance_habit_id: string
          score: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          performance_habit_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_scores_performance_habit_id_fkey"
            columns: ["performance_habit_id"]
            isOneToOne: false
            referencedRelation: "performance_habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_scores_performance_habit_id_fkey"
            columns: ["performance_habit_id"]
            isOneToOne: false
            referencedRelation: "performance_habits_readable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoro_sessions: {
        Row: {
          break_segments: number | null
          completed_at: string
          cover_image_url: string | null
          created_at: string
          duration_minutes: number
          id: string
          linked_performance_habit_id: string | null
          preset_name: string
          session_name: string | null
          session_type: string
          status: string
          timer_mode: string | null
          user_id: string
          work_segments: number | null
        }
        Insert: {
          break_segments?: number | null
          completed_at?: string
          cover_image_url?: string | null
          created_at?: string
          duration_minutes: number
          id?: string
          linked_performance_habit_id?: string | null
          preset_name: string
          session_name?: string | null
          session_type: string
          status?: string
          timer_mode?: string | null
          user_id: string
          work_segments?: number | null
        }
        Update: {
          break_segments?: number | null
          completed_at?: string
          cover_image_url?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          linked_performance_habit_id?: string | null
          preset_name?: string
          session_name?: string | null
          session_type?: string
          status?: string
          timer_mode?: string | null
          user_id?: string
          work_segments?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_linked_performance_habit_id_fkey"
            columns: ["linked_performance_habit_id"]
            isOneToOne: false
            referencedRelation: "performance_habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pomodoro_sessions_linked_performance_habit_id_fkey"
            columns: ["linked_performance_habit_id"]
            isOneToOne: false
            referencedRelation: "performance_habits_readable"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_settings: {
        Row: {
          created_at: string
          id: string
          show_calendar: boolean
          show_habits: boolean
          show_performance: boolean
          show_sleep: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          show_calendar?: boolean
          show_habits?: boolean
          show_performance?: boolean
          show_sleep?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          show_calendar?: boolean
          show_habits?: boolean
          show_performance?: boolean
          show_sleep?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "privacy_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      set_entries: {
        Row: {
          exercise_id: string
          id: string
          reps: number
          session_id: string
          set_number: number
          timestamp: string
          unit: Database["public"]["Enums"]["weight_unit"]
          weight: number
        }
        Insert: {
          exercise_id: string
          id?: string
          reps: number
          session_id: string
          set_number: number
          timestamp?: string
          unit: Database["public"]["Enums"]["weight_unit"]
          weight: number
        }
        Update: {
          exercise_id?: string
          id?: string
          reps?: number
          session_id?: string
          set_number?: number
          timestamp?: string
          unit?: Database["public"]["Enums"]["weight_unit"]
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "set_entries_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "gym_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_cycles: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      sleep_entries: {
        Row: {
          bedtime: string | null
          created_at: string
          date: string
          hours_slept: number
          id: string
          mood: string
          notes: string | null
          sleep_quality: number | null
          user_id: string
          wake_time: string | null
        }
        Insert: {
          bedtime?: string | null
          created_at?: string
          date: string
          hours_slept: number
          id?: string
          mood: string
          notes?: string | null
          sleep_quality?: number | null
          user_id: string
          wake_time?: string | null
        }
        Update: {
          bedtime?: string | null
          created_at?: string
          date?: string
          hours_slept?: number
          id?: string
          mood?: string
          notes?: string | null
          sleep_quality?: number | null
          user_id?: string
          wake_time?: string | null
        }
        Relationships: []
      }
      study_lessons: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          lesson_number: number
          released_at: string | null
          status: string
          subject_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_number: number
          released_at?: string | null
          status?: string
          subject_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_number?: number
          released_at?: string | null
          status?: string
          subject_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "study_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      study_subjects: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          next_release_at: string | null
          pending_lessons: number
          release_day: string | null
          release_schedule: string | null
          release_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          next_release_at?: string | null
          pending_lessons?: number
          release_day?: string | null
          release_schedule?: string | null
          release_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          next_release_at?: string | null
          pending_lessons?: number
          release_day?: string | null
          release_schedule?: string | null
          release_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      time_blocks: {
        Row: {
          color: string
          created_at: string
          date: string
          description: string | null
          end_time: string
          icon: string | null
          id: string
          note_id: string | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          date: string
          description?: string | null
          end_time: string
          icon?: string | null
          id?: string
          note_id?: string | null
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          date?: string
          description?: string | null
          end_time?: string
          icon?: string | null
          id?: string
          note_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_blocks_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      calendar_notes_readable: {
        Row: {
          color: string | null
          content: string | null
          created_at: string | null
          date: string | null
          full_name: string | null
          id: string | null
          reminder_time: string | null
          title: string | null
          username: string | null
        }
        Relationships: []
      }
      friends_readable: {
        Row: {
          addressee_avatar_url: string | null
          addressee_full_name: string | null
          addressee_id: string | null
          addressee_username: string | null
          created_at: string | null
          id: string | null
          requester_avatar_url: string | null
          requester_full_name: string | null
          requester_id: string | null
          requester_username: string | null
          status: Database["public"]["Enums"]["friend_status"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friends_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_completions_readable: {
        Row: {
          completed: boolean | null
          created_at: string | null
          date: string | null
          full_name: string | null
          habit_color: string | null
          habit_name: string | null
          id: string | null
          username: string | null
        }
        Relationships: []
      }
      habit_cycles_readable: {
        Row: {
          created_at: string | null
          end_date: string | null
          full_name: string | null
          id: string | null
          is_current: boolean | null
          start_date: string | null
          username: string | null
        }
        Relationships: []
      }
      habit_notes_readable: {
        Row: {
          created_at: string | null
          date: string | null
          full_name: string | null
          id: string | null
          note: string | null
          username: string | null
        }
        Relationships: []
      }
      habits_readable: {
        Row: {
          color: string | null
          created_at: string | null
          difficulty_weight: number | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          is_preloaded: boolean | null
          name: string | null
          priority: string | null
          username: string | null
        }
        Relationships: []
      }
      performance_cycles_readable: {
        Row: {
          created_at: string | null
          end_date: string | null
          full_name: string | null
          id: string | null
          is_current: boolean | null
          start_date: string | null
          username: string | null
        }
        Relationships: []
      }
      performance_habits_readable: {
        Row: {
          color: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          username: string | null
        }
        Relationships: []
      }
      performance_scores_readable: {
        Row: {
          created_at: string | null
          date: string | null
          full_name: string | null
          habit_color: string | null
          habit_name: string | null
          id: string | null
          score: number | null
          username: string | null
        }
        Relationships: []
      }
      sleep_cycles_readable: {
        Row: {
          created_at: string | null
          end_date: string | null
          full_name: string | null
          id: string | null
          is_current: boolean | null
          start_date: string | null
          username: string | null
        }
        Relationships: []
      }
      sleep_entries_readable: {
        Row: {
          bedtime: string | null
          created_at: string | null
          date: string | null
          full_name: string | null
          hours_slept: number | null
          id: string | null
          mood: string | null
          notes: string | null
          sleep_quality: number | null
          username: string | null
          wake_time: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      are_friends: {
        Args: { _user_id_1: string; _user_id_2: string }
        Returns: boolean
      }
      can_view_calendar: {
        Args: { _owner_id: string; _viewer_id: string }
        Returns: boolean
      }
      can_view_habits: {
        Args: { _owner_id: string; _viewer_id: string }
        Returns: boolean
      }
      can_view_performance: {
        Args: { _owner_id: string; _viewer_id: string }
        Returns: boolean
      }
      can_view_sleep: {
        Args: { _owner_id: string; _viewer_id: string }
        Returns: boolean
      }
      get_friend_activities: {
        Args: { _limit?: number; _offset?: number; _viewer_id: string }
        Returns: {
          activity_data: Json
          activity_type: string
          avatar_url: string
          created_at: string
          full_name: string
          id: string
          user_id: string
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      friend_status: "pending" | "accepted" | "rejected" | "blocked"
      session_status: "planned" | "completed" | "skipped"
      weight_unit: "kg" | "lbs"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      friend_status: ["pending", "accepted", "rejected", "blocked"],
      session_status: ["planned", "completed", "skipped"],
      weight_unit: ["kg", "lbs"],
    },
  },
} as const
