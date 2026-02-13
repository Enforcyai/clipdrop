export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type GenerationMode = 'recorded' | 'text2video' | 'image2video' | 'video2video'
export type GenerationStatus = 'pending' | 'processing' | 'succeeded' | 'failed'
export type VideoStyle = 'Realistic' | 'Cartoon' | 'Anime' | 'Neon' | 'Vintage'
export type AspectRatio = '9:16' | '1:1' | '16:9'
export type Intensity = 'low' | 'medium' | 'high'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          is_private: boolean
          credits_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          is_private?: boolean
          credits_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          is_private?: boolean
          credits_balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          id: string
          user_id: string
          mode: GenerationMode
          status: GenerationStatus
          prompt: string | null
          template_id: string | null
          input_asset_url: string | null
          output_video_url: string | null
          thumbnail_url: string | null
          settings: Json
          caption: string | null
          hashtags: string[] | null
          is_published: boolean
          progress: number
          provider_job_id: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mode: GenerationMode
          status?: GenerationStatus
          prompt?: string | null
          template_id?: string | null
          input_asset_url?: string | null
          output_video_url?: string | null
          thumbnail_url?: string | null
          settings?: Json
          caption?: string | null
          hashtags?: string[] | null
          is_published?: boolean
          progress?: number
          provider_job_id?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mode?: GenerationMode
          status?: GenerationStatus
          prompt?: string | null
          template_id?: string | null
          input_asset_url?: string | null
          output_video_url?: string | null
          thumbnail_url?: string | null
          settings?: Json
          caption?: string | null
          hashtags?: string[] | null
          is_published?: boolean
          progress?: number
          provider_job_id?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_generations_template"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          tags: string[]
          preview_url: string | null
          default_settings: Json
          prompt_suggestions: string[]
          is_featured: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          category: string
          tags?: string[]
          preview_url?: string | null
          default_settings?: Json
          prompt_suggestions?: string[]
          is_featured?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          tags?: string[]
          preview_url?: string | null
          default_settings?: Json
          prompt_suggestions?: string[]
          is_featured?: boolean
          created_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          generation_id: string
          user_id: string
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          generation_id: string
          user_id: string
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          generation_id?: string
          user_id?: string
          caption?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Generation = Database['public']['Tables']['generations']['Row']
export type GenerationInsert = Database['public']['Tables']['generations']['Insert']
export type Template = Database['public']['Tables']['templates']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Like = Database['public']['Tables']['likes']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Event = Database['public']['Tables']['events']['Row']

export type VideoSettings = {
  duration: number
  style: VideoStyle
  aspect_ratio: AspectRatio
  intensity: Intensity
  camera?: 'front' | 'rear'
  prompt?: string
  template_id?: string
  // Creative Studio additions
  audio_url?: string
  audio_name?: string
  overlay_style?: string
  text_overlay?: string
  text_style?: string
}
