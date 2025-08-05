import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'
import { DatabaseService } from '@/lib/database'
import { LocationService } from '@/lib/location'
import ProductInfo from './ProductInfo'
import PriceComparison from './PriceComparison'
import PriceHistory from './PriceHistory'
import RelatedProducts from './RelatedProducts'
import type { Product } from '@/lib/types'
import toast from 'react-hot-toast'

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    // Get user location
    LocationService.getCurrentLocation()
      .then(location => setUserLocation(location))
      .catch(error => {
        console.error('Failed to get location:', error)
      })
  }, [])

  useEffect(() => {
    if (!id) {
      navigate('/')
      return
    }

    const fetchProduct = async () => {
      setLoading(true)
      try {
        const productData = await DatabaseService.getProductById(id)
        if (!productData) {
          toast.error('商品が見つかりませんでした')
          navigate('/')
          return
        }
        setProduct(productData)
      } catch (error) {
        console.error('Failed to fetch product:', error)
        toast.error('商品情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>戻る</span>
            </button>
            
            {userLocation && (
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>現在地から</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Info */}
        <ProductInfo product={product} />

        {/* Price Comparison */}
        <div className="mt-8">
          <PriceComparison 
            productId={product.id} 
            userLocation={userLocation}
          />
        </div>

        {/* Price History */}
        <div className="mt-8">
          <PriceHistory productId={product.id} />
        </div>

        {/* Related Products */}
        <div className="mt-8">
          <RelatedProducts 
            currentProductId={product.id}
            productName={product.name}
          />
        </div>
      </main>
    </div>
  )
}

export default ProductDetailPage