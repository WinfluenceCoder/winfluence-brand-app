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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      brands: {
        Row: {
          banner_url: string | null
          billing_address_city: string | null
          billing_address_nr: number | null
          billing_address_street: string | null
          billing_address_to: string | null
          billing_address_zip: number | null
          brand_name: string | null
          brand_pitch: string | null
          created_at: string
          domain: string
          e_mail_address: string
          first_name: string | null
          hashtags: string | null
          id: number
          insta_url: string | null
          is_female: boolean | null
          is_male: boolean | null
          job_title: string | null
          last_name: string | null
          legal_name: string | null
          linkedin_url: string | null
          logo_url: string | null
          mobile: string | null
          mwst_nr: string | null
          sales_rep: string | null
          status: string | null
          tiktok_url: string | null
          updated_at: string
          user_foto_url: string | null
          user_id: string | null
          user_linkedin_url: string | null
          youtube_url: string | null
        }
        Insert: {
          banner_url?: string | null
          billing_address_city?: string | null
          billing_address_nr?: number | null
          billing_address_street?: string | null
          billing_address_to?: string | null
          billing_address_zip?: number | null
          brand_name?: string | null
          brand_pitch?: string | null
          created_at?: string
          domain: string
          e_mail_address: string
          first_name?: string | null
          hashtags?: string | null
          id?: never
          insta_url?: string | null
          is_female?: boolean | null
          is_male?: boolean | null
          job_title?: string | null
          last_name?: string | null
          legal_name?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          mobile?: string | null
          mwst_nr?: string | null
          sales_rep?: string | null
          status?: string | null
          tiktok_url?: string | null
          updated_at?: string
          user_foto_url?: string | null
          user_id?: string | null
          user_linkedin_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          banner_url?: string | null
          billing_address_city?: string | null
          billing_address_nr?: number | null
          billing_address_street?: string | null
          billing_address_to?: string | null
          billing_address_zip?: number | null
          brand_name?: string | null
          brand_pitch?: string | null
          created_at?: string
          domain?: string
          e_mail_address?: string
          first_name?: string | null
          hashtags?: string | null
          id?: never
          insta_url?: string | null
          is_female?: boolean | null
          is_male?: boolean | null
          job_title?: string | null
          last_name?: string | null
          legal_name?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          mobile?: string | null
          mwst_nr?: string | null
          sales_rep?: string | null
          status?: string | null
          tiktok_url?: string | null
          updated_at?: string
          user_foto_url?: string | null
          user_id?: string | null
          user_linkedin_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          apply_till: string | null
          barter_order_coupon: string | null
          barter_order_url: string | null
          barter_value: number | null
          brand_id: number
          brand_logo_url: string | null
          brand_name: string | null
          briefing: string | null
          budget: number | null
          campaign_visual_url: string | null
          coupon: string | null
          created_at: string
          ende: string | null
          goal: string
          hashtags: string | null
          id: number
          key_message: string | null
          link_list: string | null
          name: string
          post_type: string | null
          product: string | null
          requirements: string | null
          start: string | null
          status: string | null
          target_url: string | null
          targetgroup: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          apply_till?: string | null
          barter_order_coupon?: string | null
          barter_order_url?: string | null
          barter_value?: number | null
          brand_id: number
          brand_logo_url?: string | null
          brand_name?: string | null
          briefing?: string | null
          budget?: number | null
          campaign_visual_url?: string | null
          coupon?: string | null
          created_at?: string
          ende?: string | null
          goal: string
          hashtags?: string | null
          id?: never
          key_message?: string | null
          link_list?: string | null
          name: string
          post_type?: string | null
          product?: string | null
          requirements?: string | null
          start?: string | null
          status?: string | null
          target_url?: string | null
          targetgroup?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          apply_till?: string | null
          barter_order_coupon?: string | null
          barter_order_url?: string | null
          barter_value?: number | null
          brand_id?: number
          brand_logo_url?: string | null
          brand_name?: string | null
          briefing?: string | null
          budget?: number | null
          campaign_visual_url?: string | null
          coupon?: string | null
          created_at?: string
          ende?: string | null
          goal?: string
          hashtags?: string | null
          id?: never
          key_message?: string | null
          link_list?: string | null
          name?: string
          post_type?: string | null
          product?: string | null
          requirements?: string | null
          start?: string | null
          status?: string | null
          target_url?: string | null
          targetgroup?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      collabs: {
        Row: {
          brand_feedback: string | null
          brand_rating: number | null
          campaign_id: number
          created_at: string
          creator_id: number
          creator_remark: string | null
          id: number
          kpi_list: string | null
          link_list: string | null
          media_files_url_list: string | null
          pitch: string | null
          post_type: string | null
          price: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          brand_feedback?: string | null
          brand_rating?: number | null
          campaign_id: number
          created_at?: string
          creator_id: number
          creator_remark?: string | null
          id?: never
          kpi_list?: string | null
          link_list?: string | null
          media_files_url_list?: string | null
          pitch?: string | null
          post_type?: string | null
          price?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          brand_feedback?: string | null
          brand_rating?: number | null
          campaign_id?: number
          created_at?: string
          creator_id?: number
          creator_remark?: string | null
          id?: never
          kpi_list?: string | null
          link_list?: string | null
          media_files_url_list?: string | null
          pitch?: string | null
          post_type?: string | null
          price?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collabs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collabs_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          address_city: string | null
          address_nr: number | null
          address_street: string | null
          address_zip: number | null
          company_legal_name: string | null
          created_at: string
          e_mail_address: string
          first_name: string
          foto_url: string | null
          id: number
          insta_url: string | null
          is_company: boolean | null
          is_female: boolean
          is_male: boolean
          last_name: string
          linkedin_url: string | null
          mobile: string | null
          nick_name: string | null
          status: string | null
          tiktok_url: string | null
          updated_at: string
          user_id: string | null
          youtube_url: string | null
        }
        Insert: {
          address_city?: string | null
          address_nr?: number | null
          address_street?: string | null
          address_zip?: number | null
          company_legal_name?: string | null
          created_at?: string
          e_mail_address: string
          first_name: string
          foto_url?: string | null
          id?: never
          insta_url?: string | null
          is_company?: boolean | null
          is_female?: boolean
          is_male?: boolean
          last_name: string
          linkedin_url?: string | null
          mobile?: string | null
          nick_name?: string | null
          status?: string | null
          tiktok_url?: string | null
          updated_at?: string
          user_id?: string | null
          youtube_url?: string | null
        }
        Update: {
          address_city?: string | null
          address_nr?: number | null
          address_street?: string | null
          address_zip?: number | null
          company_legal_name?: string | null
          created_at?: string
          e_mail_address?: string
          first_name?: string
          foto_url?: string | null
          id?: never
          insta_url?: string | null
          is_company?: boolean | null
          is_female?: boolean
          is_male?: boolean
          last_name?: string
          linkedin_url?: string | null
          mobile?: string | null
          nick_name?: string | null
          status?: string | null
          tiktok_url?: string | null
          updated_at?: string
          user_id?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
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
      app_role: ["admin", "editor", "viewer"],
    },
  },
} as const
