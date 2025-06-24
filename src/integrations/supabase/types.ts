export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          achieved_date: string | null
          created_at: string | null
          current_value: number | null
          description: string | null
          id: string
          status: string | null
          target_date: string | null
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achieved_date?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          status?: string | null
          target_date?: string | null
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achieved_date?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          status?: string | null
          target_date?: string | null
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      injuries: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string | null
          fitness_level: string | null
          full_name: string | null
          height: string | null
          id: string
          limitations: string | null
          max_workout_time: number | null
          preferences: string | null
          preferred_time: number | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          fitness_level?: string | null
          full_name?: string | null
          height?: string | null
          id: string
          limitations?: string | null
          max_workout_time?: number | null
          preferences?: string | null
          preferred_time?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          fitness_level?: string | null
          full_name?: string | null
          height?: string | null
          id?: string
          limitations?: string | null
          max_workout_time?: number | null
          preferences?: string | null
          preferred_time?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          trial_end: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          completed_date: string | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          duration_minutes: number | null
          exercises: Json | null
          id: string
          name: string
          scheduled_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          exercises?: Json | null
          id?: string
          name: string
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          exercises?: Json | null
          id?: string
          name?: string
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          calories_burned: number | null
          created_at: string | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          name: string
          notes: string | null
          plan_id: string | null
          start_time: string | null
          user_id: string
          workout_date: string | null
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          name: string
          notes?: string | null
          plan_id?: string | null
          start_time?: string | null
          user_id: string
          workout_date?: string | null
        }
        Update: {
          calories_burned?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          name?: string
          notes?: string | null
          plan_id?: string | null
          start_time?: string | null
          user_id?: string
          workout_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
