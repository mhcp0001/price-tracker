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
      anonymous_users: {
        Row: {
          id: string
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          name: string
          address: string | null
          location: unknown | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          location?: unknown | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          location?: unknown | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          jan_code: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          jan_code?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          jan_code?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      prices: {
        Row: {
          id: string
          product_id: string
          store_id: string
          price: number
          reported_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          store_id: string
          price: number
          reported_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          store_id?: string
          price?: number
          reported_by?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      latest_prices: {
        Row: {
          id: string
          product_id: string
          store_id: string
          price: number
          reported_by: string | null
          created_at: string
        }
      }
    }
    Functions: {
      get_nearby_stores: {
        Args: {
          lat: number
          lng: number
          radius_meters?: number
        }
        Returns: {
          id: string
          name: string
          address: string | null
          distance_meters: number
          location_lat: number
          location_lng: number
        }[]
      }
      search_products: {
        Args: {
          search_query: string
          limit_count?: number
        }
        Returns: {
          id: string
          name: string
          description: string | null
          jan_code: string | null
          image_url: string | null
        }[]
      }
    }
    Enums: {}
  }
}