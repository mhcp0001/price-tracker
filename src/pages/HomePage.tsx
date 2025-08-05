import { useEffect, useState, useCallback } from 'react'
import { MapPin, Search, Plus, Package, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { StoreMap } from '@/components/maps/StoreMap'
import { PriceSubmissionForm } from '@/components/forms/PriceSubmissionForm'
import { DatabaseService } from '@/lib/database'
import type { Store } from '@/lib/types'
import toast from 'react-hot-toast'

const HomePage = () => {
  const navigate = useNavigate()
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [showPriceForm, setShowPriceForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    // Get user's current location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          setLocationError('位置情報の取得に失敗しました')
          console.error('Location error:', error)
        }
      )
    } else {
      setLocationError('お使いのブラウザは位置情報をサポートしていません')
    }
  }, [])

  const fetchNearbyStores = useCallback(async () => {
    if (!location) return

    setLoading(true)
    try {
      const nearbyStores = await DatabaseService.getNearbyStores(
        location.lat,
        location.lng,
        2000 // 2km radius
      )
      setStores(nearbyStores)
    } catch (error) {
      console.error('Failed to fetch nearby stores:', error)
      toast.error('近隣店舗の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [location])

  // 位置情報が取得できたら近隣店舗を取得
  useEffect(() => {
    if (location && !loading) {
      fetchNearbyStores()
    }
  }, [location, loading, fetchNearbyStores])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const results = await DatabaseService.searchProductsWithPrices(searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      toast.error('検索に失敗しました')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Price Tracker</h1>
            <nav className="flex space-x-4">
              <button className="text-gray-700 hover:text-gray-900">
                <Search className="w-5 h-5" />
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">商品を検索</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="商品名を入力（例: 牛乳、パン）"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>{searching ? '検索中...' : '検索'}</span>
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">検索結果</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Package className="w-5 h-5 text-gray-400" />
                          <h4 className="font-medium text-gray-900 line-clamp-1">
                            {product.name}
                          </h4>
                        </div>
                        {product.min_price && (
                          <p className="mt-2 text-lg font-bold text-primary-600">
                            ¥{product.min_price}
                            {product.max_price && product.max_price !== product.min_price && (
                              <span className="text-sm font-normal text-gray-500">
                                {' '}〜 ¥{product.max_price}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-6">
            <MapPin className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold">現在地周辺の店舗</h2>
          </div>

          {locationError ? (
            <div className="text-center py-12">
              <p className="text-gray-500">{locationError}</p>
              <button 
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                onClick={() => window.location.reload()}
              >
                位置情報を許可する
              </button>
            </div>
          ) : location ? (
            <div className="h-[400px] rounded-lg overflow-hidden">
              <StoreMap
                stores={stores}
                center={location}
                onStoreSelect={setSelectedStore}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">位置情報を取得中...</p>
            </div>
          )}
        </div>

        {/* Store List */}
        {stores.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">近隣店舗一覧</h2>
            <div className="space-y-3">
              {stores.map(store => (
                <div
                  key={store.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedStore?.id === store.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedStore(store)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{store.name}</h3>
                      {store.address && (
                        <p className="text-sm text-gray-600 mt-1">{store.address}</p>
                      )}
                    </div>
                    {store.distance_meters && (
                      <span className="text-sm text-gray-500">
                        {store.distance_meters < 1000
                          ? `${store.distance_meters}m`
                          : `${(store.distance_meters / 1000).toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Submission Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">価格を投稿</h2>
            {selectedStore && (
              <span className="text-sm text-gray-600">
                選択中: {selectedStore.name}
              </span>
            )}
          </div>
          {selectedStore ? (
            <div>
              <button 
                onClick={() => setShowPriceForm(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>価格を投稿する</span>
              </button>
            </div>
          ) : (
            <p className="text-gray-500">店舗を選択して価格を投稿してください</p>
          )}
        </div>
      </main>
      
      {/* Price Submission Form Modal */}
      {showPriceForm && selectedStore && (
        <PriceSubmissionForm
          store={selectedStore}
          onClose={() => setShowPriceForm(false)}
          onSuccess={() => {
            setShowPriceForm(false)
            // 必要に応じて価格データを再取得
          }}
        />
      )}
    </div>
  )
}

export default HomePage