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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      mission_applications: {
        Row: {
          application_message: string | null
          applied_at: string
          created_at: string
          id: string
          mission_id: string
          status: string
          updated_at: string
          volunteer_id: string
        }
        Insert: {
          application_message?: string | null
          applied_at?: string
          created_at?: string
          id?: string
          mission_id: string
          status?: string
          updated_at?: string
          volunteer_id: string
        }
        Update: {
          application_message?: string | null
          applied_at?: string
          created_at?: string
          id?: string
          mission_id?: string
          status?: string
          updated_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_applications_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_applications_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mission_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string | null
          id: string
          mission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type?: string | null
          id?: string
          mission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string | null
          id?: string
          mission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_files_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mission_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          mission_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          mission_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_messages_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mission_ratings: {
        Row: {
          created_at: string
          id: string
          mission_id: string
          rated_user_id: string
          rater_user_id: string
          rating: number
          review_text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mission_id: string
          rated_user_id: string
          rater_user_id: string
          rating: number
          review_text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mission_id?: string
          rated_user_id?: string
          rater_user_id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_ratings_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_ratings_rated_user_id_fkey"
            columns: ["rated_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mission_ratings_rater_user_id_fkey"
            columns: ["rater_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mission_template_skills: {
        Row: {
          created_at: string
          id: string
          skill_id: string
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          skill_id: string
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          skill_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_template_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_template_skills_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "mission_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_templates: {
        Row: {
          created_at: string
          description: string
          difficulty_level: string | null
          estimated_hours: number | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          closed_at: string | null
          closure_initiated_at: string | null
          created_at: string
          description: string
          difficulty_level: string | null
          estimated_hours: number | null
          id: string
          org_closed: boolean | null
          organization_id: string
          status: string
          template_id: string
          title: string
          updated_at: string
          volunteer_closed: boolean | null
        }
        Insert: {
          closed_at?: string | null
          closure_initiated_at?: string | null
          created_at?: string
          description: string
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          org_closed?: boolean | null
          organization_id: string
          status?: string
          template_id: string
          title: string
          updated_at?: string
          volunteer_closed?: boolean | null
        }
        Update: {
          closed_at?: string | null
          closure_initiated_at?: string | null
          created_at?: string
          description?: string
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          org_closed?: boolean | null
          organization_id?: string
          status?: string
          template_id?: string
          title?: string
          updated_at?: string
          volunteer_closed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "mission_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link_url: string | null
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link_url?: string | null
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link_url?: string | null
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          abn: string | null
          contact_email: string | null
          created_at: string
          description: string | null
          domain: string | null
          id: string
          last_mission_post_at: string | null
          logo_url: string | null
          mission_posts_this_month: number
          name: string
          status: string | null
          subscription_tier: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          abn?: string | null
          contact_email?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          last_mission_post_at?: string | null
          logo_url?: string | null
          mission_posts_this_month?: number
          name: string
          status?: string | null
          subscription_tier?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          abn?: string | null
          contact_email?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          last_mission_post_at?: string | null
          logo_url?: string | null
          mission_posts_this_month?: number
          name?: string
          status?: string | null
          subscription_tier?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          availability: Database["public"]["Enums"]["availability_type"] | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          first_name: string | null
          id: string
          join_date: string | null
          last_name: string | null
          level: number | null
          status: Database["public"]["Enums"]["volunteer_status"] | null
          time_zone: string | null
          updated_at: string
          user_id: string
          xp_points: number | null
        }
        Insert: {
          availability?: Database["public"]["Enums"]["availability_type"] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          first_name?: string | null
          id?: string
          join_date?: string | null
          last_name?: string | null
          level?: number | null
          status?: Database["public"]["Enums"]["volunteer_status"] | null
          time_zone?: string | null
          updated_at?: string
          user_id: string
          xp_points?: number | null
        }
        Update: {
          availability?: Database["public"]["Enums"]["availability_type"] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          first_name?: string | null
          id?: string
          join_date?: string | null
          last_name?: string | null
          level?: number | null
          status?: Database["public"]["Enums"]["volunteer_status"] | null
          time_zone?: string | null
          updated_at?: string
          user_id?: string
          xp_points?: number | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          domain: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          name?: string
        }
        Relationships: []
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
      volunteer_skills: {
        Row: {
          assigned_at: string
          assigned_by: string
          created_at: string
          id: string
          skill_id: string
          volunteer_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          created_at?: string
          id?: string
          skill_id: string
          volunteer_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          created_at?: string
          id?: string
          skill_id?: string
          volunteer_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_all_volunteers_with_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          bio: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
        }[]
      }
      get_profile_for_mission: {
        Args: { p_mission_id: string; p_user_id: string }
        Returns: {
          email: string
          first_name: string
          last_name: string
          user_id: string
        }[]
      }
      get_team_members: {
        Args: { org_id: string }
        Returns: {
          avatar_url: string
          email: string
          first_name: string
          id: string
          last_name: string
          role: string
          user_id: string
        }[]
      }
      get_user_organizations: {
        Args: Record<PropertyKey, never>
        Returns: {
          organization_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_mission_participant: {
        Args: { _mission_id: string; _user_id: string }
        Returns: boolean
      }
      is_organization_owner: {
        Args: { org_id: string }
        Returns: boolean
      }
      set_volunteer_skills_atomic: {
        Args: {
          p_admin_id: string
          p_skill_ids: string[]
          p_volunteer_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "organization_owner"
        | "team_member"
        | "volunteer"
      availability_type: "full_time" | "part_time" | "weekends" | "flexible"
      experience_level: "beginner" | "intermediate" | "advanced" | "expert"
      volunteer_status: "active" | "inactive" | "on_break"
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
      app_role: [
        "super_admin",
        "organization_owner",
        "team_member",
        "volunteer",
      ],
      availability_type: ["full_time", "part_time", "weekends", "flexible"],
      experience_level: ["beginner", "intermediate", "advanced", "expert"],
      volunteer_status: ["active", "inactive", "on_break"],
    },
  },
} as const
