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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      academy_athletes: {
        Row: {
          belt: string
          birth_date: string
          coach_id: string
          created_at: string
          gender: string
          id: string
          name: string
        }
        Insert: {
          belt: string
          birth_date: string
          coach_id: string
          created_at?: string
          gender: string
          id?: string
          name: string
        }
        Update: {
          belt?: string
          birth_date?: string
          coach_id?: string
          created_at?: string
          gender?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_athletes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "academy_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_coaches: {
        Row: {
          academy_name: string
          coach_name: string
          created_at: string
          id: string
          phone: string
        }
        Insert: {
          academy_name: string
          coach_name: string
          created_at?: string
          id?: string
          phone: string
        }
        Update: {
          academy_name?: string
          coach_name?: string
          created_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      athletes: {
        Row: {
          academy_id: string
          avatar_url: string | null
          belt: string | null
          birth_date: string | null
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          nickname: string | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          academy_id: string
          avatar_url?: string | null
          belt?: string | null
          birth_date?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          nickname?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          academy_id?: string
          avatar_url?: string | null
          belt?: string | null
          birth_date?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          nickname?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athletes_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_article_tags: {
        Row: {
          article_id: string
          tag_id: string
        }
        Insert: {
          article_id: string
          tag_id: string
        }
        Update: {
          article_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_article_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_articles: {
        Row: {
          ai_processing_notes: string | null
          ai_quality_score: number | null
          body: string | null
          body_html: string | null
          category_id: string | null
          created_at: string | null
          featured_image_alt: string | null
          featured_image_attribution: string | null
          featured_image_url: string | null
          id: string
          lead: string | null
          meta_description: string | null
          original_language: string | null
          original_title: string | null
          primary_keyword: string | null
          published_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          scraped_at: string | null
          search_vector: unknown
          seo_title: string | null
          slug: string
          source_name: string | null
          source_url: string | null
          status: string
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_processing_notes?: string | null
          ai_quality_score?: number | null
          body?: string | null
          body_html?: string | null
          category_id?: string | null
          created_at?: string | null
          featured_image_alt?: string | null
          featured_image_attribution?: string | null
          featured_image_url?: string | null
          id?: string
          lead?: string | null
          meta_description?: string | null
          original_language?: string | null
          original_title?: string | null
          primary_keyword?: string | null
          published_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          scraped_at?: string | null
          search_vector?: unknown
          seo_title?: string | null
          slug: string
          source_name?: string | null
          source_url?: string | null
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_processing_notes?: string | null
          ai_quality_score?: number | null
          body?: string | null
          body_html?: string | null
          category_id?: string | null
          created_at?: string | null
          featured_image_alt?: string | null
          featured_image_attribution?: string | null
          featured_image_url?: string | null
          id?: string
          lead?: string | null
          meta_description?: string | null
          original_language?: string | null
          original_title?: string | null
          primary_keyword?: string | null
          published_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          scraped_at?: string | null
          search_vector?: unknown
          seo_title?: string | null
          slug?: string
          source_name?: string | null
          source_url?: string | null
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      blog_images: {
        Row: {
          alt_text: string | null
          article_id: string | null
          attribution: string | null
          created_at: string | null
          id: string
          source_name: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          article_id?: string | null
          attribution?: string | null
          created_at?: string | null
          id?: string
          source_name?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          article_id?: string | null
          attribution?: string | null
          created_at?: string | null
          id?: string
          source_name?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_images_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_rankings: {
        Row: {
          athlete_name: string
          country_code: string
          country_name: string
          discipline: string
          gender: string
          id: string
          is_brazilian: boolean | null
          points: number | null
          rank: number
          ranking_type: string
          scraped_at: string | null
          source_url: string | null
          updated_at: string | null
          weight_class: string
        }
        Insert: {
          athlete_name: string
          country_code: string
          country_name: string
          discipline: string
          gender: string
          id?: string
          is_brazilian?: boolean | null
          points?: number | null
          rank: number
          ranking_type: string
          scraped_at?: string | null
          source_url?: string | null
          updated_at?: string | null
          weight_class: string
        }
        Update: {
          athlete_name?: string
          country_code?: string
          country_name?: string
          discipline?: string
          gender?: string
          id?: string
          is_brazilian?: boolean | null
          points?: number | null
          rank?: number
          ranking_type?: string
          scraped_at?: string | null
          source_url?: string | null
          updated_at?: string | null
          weight_class?: string
        }
        Relationships: []
      }
      blog_scrape_jobs: {
        Row: {
          articles_found: number | null
          articles_new: number | null
          crawler_type: string
          created_at: string | null
          cron_expression: string | null
          error_message: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          source_name: string
          source_url: string
          status: string
        }
        Insert: {
          articles_found?: number | null
          articles_new?: number | null
          crawler_type: string
          created_at?: string | null
          cron_expression?: string | null
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          source_name: string
          source_url: string
          status?: string
        }
        Update: {
          articles_found?: number | null
          articles_new?: number | null
          crawler_type?: string
          created_at?: string | null
          cron_expression?: string | null
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          source_name?: string
          source_url?: string
          status?: string
        }
        Relationships: []
      }
      blog_scrape_logs: {
        Row: {
          articles_found: number | null
          articles_new: number | null
          completed_at: string | null
          duration_ms: number | null
          error_details: Json | null
          id: string
          job_id: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          articles_found?: number | null
          articles_new?: number | null
          completed_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          id?: string
          job_id?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          articles_found?: number | null
          articles_new?: number | null
          completed_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          id?: string
          job_id?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_scrape_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "blog_scrape_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      championship_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          match_id: string
          points: number | null
          round: number | null
          side: string | null
          ts: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          match_id: string
          points?: number | null
          round?: number | null
          side?: string | null
          ts?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          match_id?: string
          points?: number | null
          round?: number | null
          side?: string | null
          ts?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "championship_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "championship_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      championship_matches: {
        Row: {
          academy_id: string
          blue_athlete_name: string | null
          blue_round_wins: number | null
          config: Json | null
          created_at: string | null
          ended_at: string | null
          id: string
          mat_id: string | null
          match_number: number | null
          red_athlete_name: string | null
          red_round_wins: number | null
          started_at: string | null
          status: string | null
          winner_side: string | null
        }
        Insert: {
          academy_id: string
          blue_athlete_name?: string | null
          blue_round_wins?: number | null
          config?: Json | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          mat_id?: string | null
          match_number?: number | null
          red_athlete_name?: string | null
          red_round_wins?: number | null
          started_at?: string | null
          status?: string | null
          winner_side?: string | null
        }
        Update: {
          academy_id?: string
          blue_athlete_name?: string | null
          blue_round_wins?: number | null
          config?: Json | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          mat_id?: string | null
          match_number?: number | null
          red_athlete_name?: string | null
          red_round_wins?: number | null
          started_at?: string | null
          status?: string | null
          winner_side?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "championship_matches_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          academy_federation: string
          created_at: string
          email: string
          id: string
          language: string
          name: string
          whatsapp: string
        }
        Insert: {
          academy_federation: string
          created_at?: string
          email: string
          id?: string
          language?: string
          name: string
          whatsapp: string
        }
        Update: {
          academy_federation?: string
          created_at?: string
          email?: string
          id?: string
          language?: string
          name?: string
          whatsapp?: string
        }
        Relationships: []
      }
      live_scores: {
        Row: {
          academy_id: string
          mat_id: number
          state: Json
          updated_at: string
        }
        Insert: {
          academy_id: string
          mat_id: number
          state?: Json
          updated_at?: string
        }
        Update: {
          academy_id?: string
          mat_id?: number
          state?: Json
          updated_at?: string
        }
        Relationships: []
      }
      open_tournaments: {
        Row: {
          created_at: string
          created_by: string
          date: string
          fee_amount: number | null
          fee_instructions: string | null
          id: string
          location: string | null
          name: string
          registration_deadline: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          fee_amount?: number | null
          fee_instructions?: string | null
          id?: string
          location?: string | null
          name: string
          registration_deadline?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          fee_amount?: number | null
          fee_instructions?: string | null
          id?: string
          location?: string | null
          name?: string
          registration_deadline?: string | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          trial_ends_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          trial_ends_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          trial_ends_at?: string
        }
        Relationships: []
      }
      registration_athletes: {
        Row: {
          athlete_id: string
          belt: string
          category: string | null
          id: string
          registration_id: string
          reviewed_by_coach: boolean | null
          weight: number
        }
        Insert: {
          athlete_id: string
          belt: string
          category?: string | null
          id?: string
          registration_id: string
          reviewed_by_coach?: boolean | null
          weight: number
        }
        Update: {
          athlete_id?: string
          belt?: string
          category?: string | null
          id?: string
          registration_id?: string
          reviewed_by_coach?: boolean | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "registration_athletes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "academy_athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_athletes_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      solo_results: {
        Row: {
          academy_id: string
          athlete_id: string
          created_at: string | null
          duration_seconds: number
          id: string
          kicks: number
          kicks_per_second: number | null
        }
        Insert: {
          academy_id: string
          athlete_id: string
          created_at?: string | null
          duration_seconds: number
          id?: string
          kicks: number
          kicks_per_second?: number | null
        }
        Update: {
          academy_id?: string
          athlete_id?: string
          created_at?: string | null
          duration_seconds?: number
          id?: string
          kicks?: number
          kicks_per_second?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "solo_results_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solo_results_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_registrations: {
        Row: {
          coach_id: string
          id: string
          payment_status: string
          reviewed_at: string | null
          status: string
          submitted_at: string
          tournament_id: string
        }
        Insert: {
          coach_id: string
          id?: string
          payment_status?: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          tournament_id: string
        }
        Update: {
          coach_id?: string
          id?: string
          payment_status?: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "academy_coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "open_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          academy_id: string
          athlete_id: string | null
          avg_score: number | null
          best_score: number | null
          created_at: string | null
          details: Json | null
          id: string
          mode: string
        }
        Insert: {
          academy_id: string
          athlete_id?: string | null
          avg_score?: number | null
          best_score?: number | null
          created_at?: string | null
          details?: Json | null
          id?: string
          mode: string
        }
        Update: {
          academy_id?: string
          athlete_id?: string | null
          avg_score?: number | null
          best_score?: number | null
          created_at?: string | null
          details?: Json | null
          id?: string
          mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
