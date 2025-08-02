// アプリケーション全体で使用する型定義

export interface Store {
  id: string
  name: string
  address: string | null
  distance_meters?: number
  location_lat?: number
  location_lng?: number
}

export interface Product {
  id: string
  name: string
  description: string | null
  jan_code: string | null
  image_url: string | null
}

export interface Price {
  id: string
  product_id: string
  store_id: string
  price: number
  reported_by: string | null
  created_at: string
  product?: Product
  store?: Store
}

export interface PriceSubmission {
  productId: string
  storeId: string
  price: number
  anonymousUserId?: string
}

export interface Location {
  lat: number
  lng: number
}