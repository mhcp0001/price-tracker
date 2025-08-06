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

  // 商品IDで商品取得
  static async getProductById(productId: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()
    
    if (error) {
      console.error('Error fetching product:', error)
      return null
    }
    
    return data
  }

  // 商品の価格統計取得
  static async getProductPriceStats(productId: string): Promise<{
    min_price: number | null
    max_price: number | null
    avg_price: number | null
    store_count: number
  }> {
    const { data, error } = await supabase
      .from('latest_prices')
      .select('price')
      .eq('product_id', productId)
    
    if (error || !data || data.length === 0) {
      return {
        min_price: null,
        max_price: null,
        avg_price: null,
        store_count: 0
      }
    }
    
    const prices = data.map(d => d.price)
    return {
      min_price: Math.min(...prices),
      max_price: Math.max(...prices),
      avg_price: prices.reduce((a, b) => a + b, 0) / prices.length,
      store_count: prices.length
    }
  }

  // 商品の店舗別価格を距離付きで取得
  static async getProductPricesWithDistance(
    productId: string,
    userLat?: number | null,
    userLng?: number | null
  ): Promise<any[]> {
    const { data, error } = await supabase
      .rpc('get_product_prices_with_distance', {
        product_id_param: productId,
        user_lat: userLat || null,
        user_lng: userLng || null
      })
    
    if (error) {
      console.error('Error fetching product prices:', error)
      throw error
    }
    
    return data || []
  }

  // 価格履歴の日別集計取得
  static async getPriceHistory(productId: string, periodDays: number): Promise<any[]> {
    const { data, error } = await supabase
      .rpc('get_price_history', {
        product_id_param: productId,
        period_days: periodDays
      })
    
    if (error) {
      console.error('Error fetching price history:', error)
      throw error
    }
    
    return data || []
  }

  // 商品検索（価格情報付き）
  static async searchProductsWithPrices(query: string, limit = 10): Promise<any[]> {
    try {
      // まず商品を検索
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(limit)
      
      if (productsError) {
        console.error('Error searching products:', productsError)
        return []
      }
      
      if (!products || products.length === 0) {
        return []
      }
      
      // 各商品の価格統計を取得
      const productsWithPrices = await Promise.all(
        products.map(async (product) => {
          const { data: prices, error: pricesError } = await supabase
            .from('latest_prices')
            .select('price')
            .eq('product_id', product.id)
          
          if (pricesError || !prices || prices.length === 0) {
            return {
              ...product,
              min_price: null,
              max_price: null
            }
          }
          
          const priceValues = prices.map(p => p.price)
          return {
            ...product,
            min_price: Math.min(...priceValues),
            max_price: Math.max(...priceValues)
          }
        })
      )
      
      return productsWithPrices
    } catch (error) {
      console.error('Error searching products with prices:', error)
      return []
    }
  }
}