import { useState, useEffect } from 'react'
import { Package, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { DatabaseService } from '@/lib/database'
import type { Product } from '@/lib/types'

interface ProductInfoProps {
  product: Product
}

interface PriceStats {
  min_price: number | null
  max_price: number | null
  avg_price: number | null
  store_count: number
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const [priceStats, setPriceStats] = useState<PriceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPriceStats = async () => {
      try {
        const stats = await DatabaseService.getProductPriceStats(product.id)
        setPriceStats(stats)
      } catch (error) {
        console.error('Failed to fetch price stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPriceStats()
  }, [product.id])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          </div>
          
          {product.description && (
            <p className="mt-3 text-gray-600">{product.description}</p>
          )}

          {product.jan_code && (
            <div className="mt-4">
              <span className="text-sm text-gray-500">JAN: </span>
              <span className="font-mono text-sm">{product.jan_code}</span>
            </div>
          )}
        </div>

        <button 
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          onClick={() => {
            // TODO: Implement add to shopping list
          }}
        >
          <Plus className="w-4 h-4" />
          <span>リストに追加</span>
        </button>
      </div>

      {/* Price Statistics */}
      {!loading && priceStats && priceStats.store_count > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">最安値</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-green-600">
              ¥{priceStats.min_price || '-'}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 text-blue-600">～</div>
              <span className="text-sm text-gray-600">平均価格</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-blue-600">
              ¥{priceStats.avg_price ? Math.round(priceStats.avg_price) : '-'}
            </p>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <span className="text-sm text-gray-600">最高値</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-red-600">
              ¥{priceStats.max_price || '-'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 text-gray-600">店</div>
              <span className="text-sm text-gray-600">取扱店舗</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-700">
              {priceStats.store_count}
            </p>
          </div>
        </div>
      )}

      {!loading && (!priceStats || priceStats.store_count === 0) && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-800">まだ価格情報がありません</p>
        </div>
      )}
    </div>
  )
}

export default ProductInfo