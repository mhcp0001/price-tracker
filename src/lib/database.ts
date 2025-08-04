import { supabase } from './supabase'
import type { Store, Product, Price, PriceSubmission } from './types'

export class DatabaseService {
  // 近隣店舗取得
  static async getNearbyStores(lat: number, lng: number, radius = 2000): Promise<Store[]> {
    const { data, error } = await supabase
      .rpc('get_nearby_stores', { lat, lng, radius_meters: radius })
    
    if (error) {
      console.error('Error fetching nearby stores:', error)
      throw error
    }
    
    return data || []
  }
  
  // 価格投稿
  static async submitPrice(priceData: PriceSubmission): Promise<Price> {
    const { data, error } = await supabase
      .from('prices')
      .insert({
        product_id: priceData.productId,
        store_id: priceData.storeId,
        price: priceData.price,
        reported_by: priceData.anonymousUserId,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error submitting price:', error)
      throw error
    }
    
    return data
  }
  
  // 商品検索
  static async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .rpc('search_products', { search_query: query, limit_count: 20 })
    
    if (error) {
      console.error('Error searching products:', error)
      throw error
    }
    
    return data || []
  }
  
  // 商品作成
  static async createProduct(name: string, description?: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({ name, description })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating product:', error)
      throw error
    }
    
    return data
  }
  
  // 商品検索または作成
  static async findOrCreateProduct(productName: string): Promise<Product> {
    // まず既存の商品を検索
    const products = await this.searchProducts(productName)
    
    if (products.length > 0) {
      // 完全一致を優先
      const exactMatch = products.find(p => p.name === productName)
      if (exactMatch) return exactMatch
      
      // 部分一致の場合は最初の結果を返す
      return products[0]
    }
    
    // 見つからない場合は新規作成
    return await this.createProduct(productName)
  }
  
  // 店舗の最新価格取得
  static async getStorePrices(storeId: string): Promise<Price[]> {
    const { data, error } = await supabase
      .from('latest_prices')
      .select(`
        *,
        product:products(*)
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching store prices:', error)
      throw error
    }
    
    return data || []
  }
  
  // 商品の価格履歴取得
  static async getProductPriceHistory(productId: string, storeId?: string): Promise<Price[]> {
    let query = supabase
      .from('prices')
      .select(`
        *,
        store:stores(*)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (storeId) {
      query = query.eq('store_id', storeId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching price history:', error)
      throw error
    }
    
    return data || []
  }
}