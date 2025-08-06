/**
 * API Integration Tests - Playwright E2Eテストの代替
 * 検索機能と価格投稿機能をAPIレベルでテスト
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import { DatabaseService } from '@/lib/database'
import { supabase } from '@/lib/supabase'

const execAsync = promisify(exec)

describe('API Integration Tests', () => {
  let testStoreId: string
  let testProductId: string

  beforeAll(async () => {
    // テストデータベースのセットアップ
    try {
      await execAsync('npm run test:setup')
    } catch (error) {
      console.warn('Test setup script not available, continuing without it')
    }

    // テスト用の店舗データを取得
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .limit(1)
    
    if (stores && stores.length > 0) {
      testStoreId = stores[0].id
    }

    // テスト用の商品データを取得
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    
    if (products && products.length > 0) {
      testProductId = products[0].id
    }
  })

  afterAll(async () => {
    // テストデータのクリーンアップ
    try {
      await execAsync('npm run test:cleanup')
    } catch (error) {
      console.warn('Test cleanup script not available, skipping cleanup')
    }
  })

  describe('商品検索機能', () => {
    it('商品名で検索できる', async () => {
      // 牛乳を検索
      const results = await DatabaseService.searchProductsWithPrices('牛乳')
      
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      
      if (results.length > 0) {
        const product = results[0]
        expect(product).toHaveProperty('id')
        expect(product).toHaveProperty('name')
        expect(product.name).toContain('牛乳')
        
        // 価格情報があるかチェック
        if (product.min_price) {
          expect(typeof product.min_price).toBe('number')
          expect(product.min_price).toBeGreaterThan(0)
        }
      }
    })

    it('存在しない商品を検索した場合は空の配列を返す', async () => {
      const results = await DatabaseService.searchProductsWithPrices('存在しない商品xyz123')
      
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(0)
    })

    it('空の検索クエリでもエラーにならない', async () => {
      const results = await DatabaseService.searchProductsWithPrices('')
      
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('価格投稿機能', () => {
    it('有効な価格データを投稿できる', async () => {
      if (!testStoreId || !testProductId) {
        console.warn('Test data not available, skipping price submission test')
        return
      }

      const priceData = {
        productId: testProductId,
        storeId: testStoreId,
        price: 250,
        anonymousUserId: 'test-user-' + Date.now()
      }

      const result = await DatabaseService.submitPrice(priceData)
      
      expect(result).toBeDefined()
      expect(result.product_id).toBe(priceData.productId)
      expect(result.store_id).toBe(priceData.storeId)
      expect(result.price).toBe(priceData.price)
      expect(result.reported_by).toBe(priceData.anonymousUserId)

      // データベースに実際に保存されているかチェック
      const { data: savedPrice } = await supabase
        .from('prices')
        .select('*')
        .eq('id', result.id)
        .single()

      expect(savedPrice).toBeDefined()
      expect(savedPrice.price).toBe(priceData.price)
    })

    it('無効な価格データ（負の価格）は拒否される', async () => {
      if (!testStoreId || !testProductId) {
        console.warn('Test data not available, skipping validation test')
        return
      }

      const invalidPriceData = {
        productId: testProductId,
        storeId: testStoreId,
        price: -100, // 負の価格
        anonymousUserId: 'test-user-' + Date.now()
      }

      await expect(DatabaseService.submitPrice(invalidPriceData))
        .rejects
        .toThrow()
    })

    it('存在しない商品IDでは価格投稿が失敗する', async () => {
      if (!testStoreId) {
        console.warn('Test data not available, skipping invalid product test')
        return
      }

      const invalidProductData = {
        productId: '00000000-0000-0000-0000-000000000000', // 存在しないUUID
        storeId: testStoreId,
        price: 250,
        anonymousUserId: 'test-user-' + Date.now()
      }

      await expect(DatabaseService.submitPrice(invalidProductData))
        .rejects
        .toThrow()
    })
  })

  describe('近隣店舗検索機能', () => {
    it('指定座標の近隣店舗を検索できる', async () => {
      // 東京駅付近の座標
      const lat = 35.6812
      const lng = 139.7671
      const radius = 5000 // 5km

      const stores = await DatabaseService.getNearbyStores(lat, lng, radius)
      
      expect(stores).toBeDefined()
      expect(Array.isArray(stores)).toBe(true)
      
      if (stores.length > 0) {
        const store = stores[0]
        expect(store).toHaveProperty('id')
        expect(store).toHaveProperty('name')
        expect(store).toHaveProperty('distance_meters')
        expect(typeof store.distance_meters).toBe('number')
        expect(store.distance_meters).toBeLessThanOrEqual(radius)
      }
    })
  })

  describe('商品データ取得機能', () => {
    it('商品IDで商品情報を取得できる', async () => {
      if (!testProductId) {
        console.warn('Test data not available, skipping product fetch test')
        return
      }

      const product = await DatabaseService.getProductById(testProductId)
      
      expect(product).toBeDefined()
      expect(product?.id).toBe(testProductId)
      expect(product?.name).toBeDefined()
      expect(typeof product?.name).toBe('string')
    })

    it('存在しない商品IDではnullを返す', async () => {
      const product = await DatabaseService.getProductById('00000000-0000-0000-0000-000000000000')
      
      expect(product).toBeNull()
    })
  })
})