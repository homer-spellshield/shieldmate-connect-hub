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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_ratings_rater_user_id_fkey"
            columns: ["rater_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
          closure_initiator_id: string | null
          created_at: string
          description: string
          difficulty_level: string | null
          estimated_hours: number | null
          id: string
          org_closed: boolean | null
          organisation_id: string
          status: string
          template_id: string
          title: string
          updated_at: string
          volunteer_closed: boolean | null
        }
        Insert: {
          closed_at?: string | null
          closure_initiated_at?: string | null
          closure_initiator_id?: string | null
          created_at?: string
          description: string
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          org_closed?: boolean | null
          organisation_id: string
          status?: string
          template_id: string
          title: string
          updated_at?: string
          volunteer_closed?: boolean | null
        }
        Update: {
          closed_at?: string | null
          closure_initiated_at?: string | null
          closure_initiator_id?: string | null
          created_at?: string
          description?: string
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          org_closed?: boolean | null
          organisation_id?: string
          status?: string
          template_id?: string
          title?: string
          updated_at?: string
          volunteer_closed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_closure_initiator_id_fkey"
            columns: ["closure_initiator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
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
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_members: {
        Row: {
          created_at: string
          id: string
          organisation_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organisation_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organisation_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
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
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "volunteer_skills_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_skills_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_all_volunteers_with_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          first_name: string
          last_name: string
          bio: string
          created_at: string
        }[]
      }
      get_team_members: {
        Args: {
          org_id: string
        }
        Returns: {
          id: string
          role: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          avatar_url: string
        }[]
      }
      get_user_organisations: {
        Args: Record<PropertyKey, never>
        Returns: {
          organisation_id: string
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_mission_participant: {
        Args: {
          _mission_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_organisation_owner: {
        Args: {
          org_id: string
        }
        Returns: boolean
      }
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "organisation_owner"
        | "team_member"
        | "volunteer"
      availability_type: "full_time" | "part_time" | "weekends" | "flexible"
      experience_level: "beginner" | "intermediate" | "advanced" | "expert"
      mission_status:
        | "open"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "pending_closure"
      volunteer_status: "active" | "inactive" | "on_break"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
