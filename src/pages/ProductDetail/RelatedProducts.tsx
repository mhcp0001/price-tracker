import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ChevronRight } from 'lucide-react'
import { DatabaseService } from '@/lib/database'
import type { Product } from '@/lib/types'

interface RelatedProductsProps {
  currentProductId: string
  productName: string
}

interface ProductWithPrice extends Product {
  min_price?: number | null
  max_price?: number | null
}

const RelatedProducts = ({ currentProductId, productName }: RelatedProductsProps) => {
  const navigate = useNavigate()
  const [relatedProducts, setRelatedProducts] = useState<ProductWithPrice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      setLoading(true)
      try {
        // Extract keywords from product name for finding related products
        const keywords = productName.split(/[\s　]+/).filter(k => k.length > 1)
        const searchQuery = keywords[0] // Use first keyword for now
        
        const products = await DatabaseService.searchProductsWithPrices(searchQuery, 5)
        // Filter out current product
        const filtered = products.filter(p => p.id !== currentProductId)
        setRelatedProducts(filtered.slice(0, 4)) // Show max 4 related products
      } catch (error) {
        console.error('Failed to fetch related products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedProducts()
  }, [currentProductId, productName])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">関連商品</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (relatedProducts.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">関連商品</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {relatedProducts.map(product => (
          <div
            key={product.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => navigate(`/products/${product.id}`)}
          >
            <div className="flex items-start space-x-3">
              <Package className="w-8 h-8 text-gray-400 flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-primary-600">
                  {product.name}
                </h3>
                
                {product.min_price && (
                  <div className="mt-2">
                    <p className="text-lg font-bold text-primary-600">
                      ¥{product.min_price}
                      {product.max_price && product.max_price !== product.min_price && (
                        <span className="text-sm font-normal text-gray-500">
                          {' '}〜 ¥{product.max_price}
                        </span>
                      )}
                    </p>
                  </div>
                )}
                
                {!product.min_price && (
                  <p className="mt-2 text-sm text-gray-500">価格情報なし</p>
                )}
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-end text-primary-600 group-hover:translate-x-1 transition-transform">
              <span className="text-sm">詳細を見る</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RelatedProducts