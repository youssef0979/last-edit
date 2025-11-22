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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
