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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      card_templates: {
        Row: {
          created_at: string
          font_size: number
          id: string
          image_url: string
          is_active: boolean
          is_default: boolean
          name: string
          text_color: string
          text_x: number
          text_y: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          font_size?: number
          id?: string
          image_url: string
          is_active?: boolean
          is_default?: boolean
          name: string
          text_color?: string
          text_x?: number
          text_y?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          font_size?: number
          id?: string
          image_url?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          text_color?: string
          text_x?: number
          text_y?: number
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      channel_stats: {
        Row: {
          created_at: string | null
          date: string
          id: string
          subscribers_count: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          subscribers_count?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          subscribers_count?: number | null
        }
        Relationships: []
      }
      custom_field_definitions: {
        Row: {
          created_at: string | null
          field_type: Database["public"]["Enums"]["field_type"]
          id: string
          is_active: boolean | null
          is_required: boolean | null
          key: string
          label: string
          label_en: string | null
          placeholder: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          field_type?: Database["public"]["Enums"]["field_type"]
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          key: string
          label: string
          label_en?: string | null
          placeholder?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          field_type?: Database["public"]["Enums"]["field_type"]
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          key?: string
          label?: string
          label_en?: string | null
          placeholder?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      custom_field_values: {
        Row: {
          field_definition_id: string
          id: string
          partner_profile_id: string
          value: string | null
        }
        Insert: {
          field_definition_id: string
          id?: string
          partner_profile_id: string
          value?: string | null
        }
        Update: {
          field_definition_id?: string
          id?: string
          partner_profile_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_field_definition_id_fkey"
            columns: ["field_definition_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_values_partner_profile_id_fkey"
            columns: ["partner_profile_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_field_settings: {
        Row: {
          created_at: string
          field_key: string
          form_type: string
          id: string
          is_required: boolean
          is_visible: boolean
          label: string
          label_en: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_key: string
          form_type: string
          id?: string
          is_required?: boolean
          is_visible?: boolean
          label: string
          label_en?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_key?: string
          form_type?: string
          id?: string
          is_required?: boolean
          is_visible?: boolean
          label?: string
          label_en?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      moderation_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          moderator_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          moderator_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          moderator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_errors: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          error_message: string | null
          error_type: string
          id: string
          partner_profile_id: string | null
          resolved: boolean | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          error_message?: string | null
          error_type: string
          id?: string
          partner_profile_id?: string | null
          resolved?: boolean | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          error_type?: string
          id?: string
          partner_profile_id?: string | null
          resolved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_errors_partner_profile_id_fkey"
            columns: ["partner_profile_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          name: string
          template: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          name: string
          template: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          name?: string
          template?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_categories: {
        Row: {
          category_id: string
          id: string
          order_id: string
        }
        Insert: {
          category_id: string
          id?: string
          order_id: string
        }
        Update: {
          category_id?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_categories_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_publications: {
        Row: {
          id: string
          message_id: number | null
          order_id: string
          partner_profile_id: string
          published_at: string | null
        }
        Insert: {
          id?: string
          message_id?: number | null
          order_id: string
          partner_profile_id: string
          published_at?: string | null
        }
        Update: {
          id?: string
          message_id?: number | null
          order_id?: string
          partner_profile_id?: string
          published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_publications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_publications_partner_profile_id_fkey"
            columns: ["partner_profile_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actuality_confirmed_at: string | null
          budget: string | null
          category_id: string
          city: string | null
          contact: string | null
          created_at: string | null
          id: string
          moderated_at: string | null
          moderated_by: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          text: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actuality_confirmed_at?: string | null
          budget?: string | null
          category_id: string
          city?: string | null
          contact?: string | null
          created_at?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          text: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actuality_confirmed_at?: string | null
          budget?: string | null
          category_id?: string
          city?: string | null
          contact?: string | null
          created_at?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          text?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_application_categories: {
        Row: {
          application_id: string
          category_id: string
          id: string
        }
        Insert: {
          application_id: string
          category_id: string
          id?: string
        }
        Update: {
          application_id?: string
          category_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_application_categories_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_application_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_applications: {
        Row: {
          age: number | null
          agency_description: string | null
          agency_name: string | null
          card_template_id: string | null
          city: string | null
          created_at: string | null
          dzen: string | null
          id: string
          moderated_at: string | null
          moderated_by: string | null
          name: string
          office_address: string | null
          phone: string | null
          photo_url: string | null
          profession: string | null
          rejection_reason: string | null
          rutube: string | null
          self_description: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          tg_channel: string | null
          tg_video: string | null
          updated_at: string | null
          user_id: string
          vk_video: string | null
          website: string | null
          youtube: string | null
        }
        Insert: {
          age?: number | null
          agency_description?: string | null
          agency_name?: string | null
          card_template_id?: string | null
          city?: string | null
          created_at?: string | null
          dzen?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          name: string
          office_address?: string | null
          phone?: string | null
          photo_url?: string | null
          profession?: string | null
          rejection_reason?: string | null
          rutube?: string | null
          self_description?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          tg_channel?: string | null
          tg_video?: string | null
          updated_at?: string | null
          user_id: string
          vk_video?: string | null
          website?: string | null
          youtube?: string | null
        }
        Update: {
          age?: number | null
          agency_description?: string | null
          agency_name?: string | null
          card_template_id?: string | null
          city?: string | null
          created_at?: string | null
          dzen?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          name?: string
          office_address?: string | null
          phone?: string | null
          photo_url?: string | null
          profession?: string | null
          rejection_reason?: string | null
          rutube?: string | null
          self_description?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          tg_channel?: string | null
          tg_video?: string | null
          updated_at?: string | null
          user_id?: string
          vk_video?: string | null
          website?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_applications_card_template_id_fkey"
            columns: ["card_template_id"]
            isOneToOne: false
            referencedRelation: "card_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_applications_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_edit_requests: {
        Row: {
          changes: Json
          created_at: string | null
          id: string
          moderated_at: string | null
          moderated_by: string | null
          partner_profile_id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["application_status"] | null
        }
        Insert: {
          changes: Json
          created_at?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          partner_profile_id: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
        }
        Update: {
          changes?: Json
          created_at?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          partner_profile_id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_edit_requests_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_edit_requests_partner_profile_id_fkey"
            columns: ["partner_profile_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profile_categories: {
        Row: {
          category_id: string
          id: string
          profile_id: string
        }
        Insert: {
          category_id: string
          id?: string
          profile_id: string
        }
        Update: {
          category_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_profile_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_profile_categories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          age: number | null
          agency_description: string | null
          agency_name: string | null
          application_id: string | null
          card_template_id: string | null
          channel_post_id: number | null
          city: string | null
          created_at: string | null
          discussion_message_id: number | null
          dzen: string | null
          id: string
          is_recommended: boolean | null
          name: string
          office_address: string | null
          paid_until: string | null
          partner_type: Database["public"]["Enums"]["partner_type"] | null
          phone: string | null
          profession: string | null
          rutube: string | null
          self_description: string | null
          status: Database["public"]["Enums"]["partner_status"] | null
          tg_channel: string | null
          tg_video: string | null
          updated_at: string | null
          user_id: string
          vk_video: string | null
          website: string | null
          youtube: string | null
        }
        Insert: {
          age?: number | null
          agency_description?: string | null
          agency_name?: string | null
          application_id?: string | null
          card_template_id?: string | null
          channel_post_id?: number | null
          city?: string | null
          created_at?: string | null
          discussion_message_id?: number | null
          dzen?: string | null
          id?: string
          is_recommended?: boolean | null
          name: string
          office_address?: string | null
          paid_until?: string | null
          partner_type?: Database["public"]["Enums"]["partner_type"] | null
          phone?: string | null
          profession?: string | null
          rutube?: string | null
          self_description?: string | null
          status?: Database["public"]["Enums"]["partner_status"] | null
          tg_channel?: string | null
          tg_video?: string | null
          updated_at?: string | null
          user_id: string
          vk_video?: string | null
          website?: string | null
          youtube?: string | null
        }
        Update: {
          age?: number | null
          agency_description?: string | null
          agency_name?: string | null
          application_id?: string | null
          card_template_id?: string | null
          channel_post_id?: number | null
          city?: string | null
          created_at?: string | null
          discussion_message_id?: number | null
          dzen?: string | null
          id?: string
          is_recommended?: boolean | null
          name?: string
          office_address?: string | null
          paid_until?: string | null
          partner_type?: Database["public"]["Enums"]["partner_type"] | null
          phone?: string | null
          profession?: string | null
          rutube?: string | null
          self_description?: string | null
          status?: Database["public"]["Enums"]["partner_status"] | null
          tg_channel?: string | null
          tg_video?: string | null
          updated_at?: string | null
          user_id?: string
          vk_video?: string | null
          website?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_profiles_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_profiles_card_template_id_fkey"
            columns: ["card_template_id"]
            isOneToOne: false
            referencedRelation: "card_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          partner_profile_id: string
          period_days: number | null
          status: string | null
          telegram_payment_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          partner_profile_id: string
          period_days?: number | null
          status?: string | null
          telegram_payment_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          partner_profile_id?: string
          period_days?: number | null
          status?: string | null
          telegram_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_partner_profile_id_fkey"
            columns: ["partner_profile_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          language_code: string | null
          last_name: string | null
          telegram_id: number
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          language_code?: string | null
          last_name?: string | null
          telegram_id: number
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          language_code?: string | null
          last_name?: string | null
          telegram_id?: number
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      question_categories: {
        Row: {
          category_id: string
          id: string
          question_id: string
        }
        Insert: {
          category_id: string
          id?: string
          question_id: string
        }
        Update: {
          category_id?: string
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_categories_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_publications: {
        Row: {
          id: string
          message_id: number | null
          partner_profile_id: string
          published_at: string | null
          question_id: string
        }
        Insert: {
          id?: string
          message_id?: number | null
          partner_profile_id: string
          published_at?: string | null
          question_id: string
        }
        Update: {
          id?: string
          message_id?: number | null
          partner_profile_id?: string
          published_at?: string | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_publications_partner_profile_id_fkey"
            columns: ["partner_profile_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_publications_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          actuality_confirmed_at: string | null
          category_id: string
          created_at: string | null
          details: string | null
          id: string
          moderated_at: string | null
          moderated_by: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actuality_confirmed_at?: string | null
          category_id: string
          created_at?: string | null
          details?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actuality_confirmed_at?: string | null
          category_id?: string
          created_at?: string | null
          details?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      get_profile_by_telegram_id: {
        Args: { _telegram_id: number }
        Returns: string
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
      app_role: "admin" | "moderator"
      application_status: "pending" | "approved" | "rejected"
      field_type: "string" | "text" | "number" | "phone" | "url" | "select"
      partner_status: "active" | "inactive" | "archived"
      partner_type: "star" | "paid" | "free"
      request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "awaiting_partners"
        | "active"
        | "expired"
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
      app_role: ["admin", "moderator"],
      application_status: ["pending", "approved", "rejected"],
      field_type: ["string", "text", "number", "phone", "url", "select"],
      partner_status: ["active", "inactive", "archived"],
      partner_type: ["star", "paid", "free"],
      request_status: [
        "pending",
        "approved",
        "rejected",
        "awaiting_partners",
        "active",
        "expired",
      ],
    },
  },
} as const
