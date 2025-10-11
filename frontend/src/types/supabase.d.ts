export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string
          title: string
          description: string
          story: string
          category: string
          image: string
          goal: number
          raised: number
          start_date: string
          end_date: string
          creator_id: string
          created_at: string
          blockchain_id?: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          story: string
          category: string
          image: string
          goal: number
          raised?: number
          start_date: string
          end_date: string
          creator_id: string
          created_at?: string
          blockchain_id?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          story?: string
          category?: string
          image?: string
          goal?: number
          raised?: number
          start_date?: string
          end_date?: string
          creator_id?: string
          created_at?: string
          blockchain_id?: string
        }
      }
      milestones: {
        Row: {
          id: string
          campaign_id: string
          title: string
          description: string
          target_date: string
          is_completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          title: string
          description: string
          target_date: string
          is_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          title?: string
          description?: string
          target_date?: string
          is_completed?: boolean
          created_at?: string
        }
      }
      contributions: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          amount: number
          created_at: string
          reward_tier_id: string | null
        }
        Insert: {
          id?: string
          campaign_id: string
          user_id: string
          amount: number
          created_at?: string
          reward_tier_id?: string | null
        }
        Update: {
          id?: string
          campaign_id?: string
          user_id?: string
          amount?: number
          created_at?: string
          reward_tier_id?: string | null
        }
      }
      reward_tiers: {
        Row: {
          id: string
          campaign_id: string
          title: string
          description: string
          minimum_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          title: string
          description: string
          minimum_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          title?: string
          description?: string
          minimum_amount?: number
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          title: string
          description: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          user_id: string
          title: string
          description: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          user_id?: string
          title?: string
          description?: string
          status?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          wallet_address: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string | null
          wallet_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          wallet_address?: string | null
          created_at?: string
        }
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
  }
}
