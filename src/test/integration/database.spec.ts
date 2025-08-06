import { describe, it, expect, vi } from 'vitest'
import { DatabaseService } from '../../lib/database'
import { supabase } from '../../lib/supabase'
import type { PostgrestSingleResponse } from '@supabase/supabase-js'

// Supabaseクライアントをモック
vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}))

describe('DatabaseService', () => {
  describe('getNearbyStores', () => {
    it('should fetch nearby stores successfully', async () => {
      const mockStores = [
        {
          id: '1',
          name: 'Test Store 1',
          address: 'Test Address 1',
          distance_meters: 500,
          location_lat: 35.6812,
          location_lng: 139.7671,
        },
      ]

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockStores,
        error: null,
      } as PostgrestSingleResponse<typeof mockStores>)

      const result = await DatabaseService.getNearbyStores(35.6812, 139.7671, 2000)

      expect(supabase.rpc).toHaveBeenCalledWith('get_nearby_stores', {
        lat: 35.6812,
        lng: 139.7671,
        radius_meters: 2000,
      })
      expect(result).toEqual(mockStores)
    })

    it('should handle errors when fetching stores', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      } as PostgrestSingleResponse<null>)

      await expect(
        DatabaseService.getNearbyStores(35.6812, 139.7671, 2000)
      ).rejects.toThrow('Database error')
    })
  })

  describe('searchProducts', () => {
    it('should search products successfully', async () => {
      const mockProducts = [
        {
          id: '1',
          name: '明治おいしい牛乳',
          description: '成分無調整牛乳',
          jan_code: '4902705000012',
          image_url: null,
        },
      ]

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockProducts,
        error: null,
      } as PostgrestSingleResponse<typeof mockProducts>)

      const result = await DatabaseService.searchProducts('牛乳')

      expect(supabase.rpc).toHaveBeenCalledWith('search_products', {
        search_query: '牛乳',
        limit_count: 20,
      })
      expect(result).toEqual(mockProducts)
    })
  })

  describe('submitPrice', () => {
    it('should submit price successfully', async () => {
      const mockPrice = {
        id: '1',
        product_id: 'prod1',
        store_id: 'store1',
        price: 298,
        reported_by: 'user1',
        created_at: '2024-01-01T00:00:00Z',
      }

      const fromMock = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPrice, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(fromMock as ReturnType<typeof supabase.from>)

      const result = await DatabaseService.submitPrice({
        productId: 'prod1',
        storeId: 'store1',
        price: 298,
        anonymousUserId: 'user1',
      })

      expect(supabase.from).toHaveBeenCalledWith('prices')
      expect(fromMock.insert).toHaveBeenCalledWith({
        product_id: 'prod1',
        store_id: 'store1',
        price: 298,
        reported_by: 'user1',
      })
      expect(result).toEqual(mockPrice)
    })
  })
})