import { useState, useEffect } from 'react'
import { MapPin, ChevronUp, ChevronDown, Store } from 'lucide-react'
import { DatabaseService } from '@/lib/database'
import { formatDistance, formatDate } from '@/lib/utils'

interface PriceComparisonProps {
  productId: string
  userLocation?: { lat: number; lng: number } | null
}

interface StorePrice {
  store_id: string
  store_name: string
  address: string
  price: number
  distance_meters?: number | null
  last_updated: string
}

enum SortBy {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  DISTANCE_ASC = 'distance_asc',
  STORE_NAME = 'store_name'
}

const PriceComparison = ({ productId, userLocation }: PriceComparisonProps) => {
  const [storePrices, setStorePrices] = useState<StorePrice[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.PRICE_ASC)

  useEffect(() => {
    const fetchStorePrices = async () => {
      setLoading(true)
      try {
        const prices = await DatabaseService.getProductPricesWithDistance(
          productId,
          userLocation?.lat,
          userLocation?.lng
        )
        setStorePrices(prices)
      } catch (error) {
        console.error('Failed to fetch store prices:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStorePrices()
  }, [productId, userLocation])

  const sortedPrices = [...storePrices].sort((a, b) => {
    switch (sortBy) {
      case SortBy.PRICE_ASC:
        return a.price - b.price
      case SortBy.PRICE_DESC:
        return b.price - a.price
      case SortBy.DISTANCE_ASC:
        if (!a.distance_meters || !b.distance_meters) return 0
        return a.distance_meters - b.distance_meters
      case SortBy.STORE_NAME:
        return a.store_name.localeCompare(b.store_name)
      default:
        return 0
    }
  })

  const SortButton = ({ 
    sortType, 
    label 
  }: { 
    sortType: SortBy
    label: string 
  }) => {
    const isActive = sortBy === sortType
    return (
      <button
        onClick={() => setSortBy(sortType)}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          isActive 
            ? 'bg-primary-100 text-primary-700' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <span>{label}</span>
        {isActive && (
          sortType.includes('desc') ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
        )}
      </button>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">価格比較</h2>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (storePrices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">価格比較</h2>
        <p className="text-gray-500">この商品の価格情報はまだありません</p>
      </div>
    )
  }

  const minPrice = Math.min(...storePrices.map(p => p.price))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">価格比較</h2>
        <div className="flex items-center space-x-2">
          <SortButton sortType={SortBy.PRICE_ASC} label="価格順" />
          {userLocation && (
            <SortButton sortType={SortBy.DISTANCE_ASC} label="距離順" />
          )}
          <SortButton sortType={SortBy.STORE_NAME} label="店舗名順" />
        </div>
      </div>

      <div className="space-y-3">
        {sortedPrices.map((storePrice) => {
          const priceDiff = storePrice.price - minPrice
          const isLowest = storePrice.price === minPrice

          return (
            <div
              key={storePrice.store_id}
              className={`p-4 rounded-lg border-2 transition-colors ${
                isLowest 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Store className="w-5 h-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">
                      {storePrice.store_name}
                    </h3>
                    {isLowest && (
                      <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                        最安値
                      </span>
                    )}
                  </div>
                  
                  <p className="mt-1 text-sm text-gray-600">
                    {storePrice.address}
                  </p>

                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    {storePrice.distance_meters && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{formatDistance(storePrice.distance_meters)}</span>
                      </div>
                    )}
                    <span>更新: {formatDate(storePrice.last_updated)}</span>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <p className={`text-2xl font-bold ${
                    isLowest ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    ¥{storePrice.price}
                  </p>
                  {priceDiff > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      +¥{priceDiff}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PriceComparison