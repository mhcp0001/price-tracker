import { useState, FormEvent } from 'react'
import { Search, X } from 'lucide-react'
import { DatabaseService } from '@/lib/database'
import { AnonymousUserService } from '@/lib/anonymousUser'
import type { Store, Product } from '@/lib/types'
import toast from 'react-hot-toast'

interface PriceSubmissionFormProps {
  store: Store
  onClose: () => void
  onSuccess?: () => void
}

export const PriceSubmissionForm = ({ store, onClose, onSuccess }: PriceSubmissionFormProps) => {
  const [productName, setProductName] = useState('')
  const [price, setPrice] = useState('')
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showSearchResults, setShowSearchResults] = useState(false)

  const searchProducts = async () => {
    if (!productName.trim()) return

    setSearching(true)
    try {
      const results = await DatabaseService.searchProducts(productName)
      setSearchResults(results)
      setShowSearchResults(true)
    } catch (error) {
      console.error('Failed to search products:', error)
      toast.error('商品検索に失敗しました')
    } finally {
      setSearching(false)
    }
  }

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setProductName(product.name)
    setShowSearchResults(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!productName.trim() || !price.trim()) {
      toast.error('商品名と価格を入力してください')
      return
    }

    const priceValue = parseFloat(price)
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error('正しい価格を入力してください')
      return
    }

    setSubmitting(true)
    try {
      // 商品を検索または作成
      let product = selectedProduct
      if (!product) {
        product = await DatabaseService.findOrCreateProduct(productName)
      }

      // 匿名ユーザーIDを取得（必要に応じて作成）
      const anonymousUserId = await AnonymousUserService.getAnonymousUserId()
      
      // 価格を投稿
      await DatabaseService.submitPrice({
        productId: product.id,
        storeId: store.id,
        price: priceValue,
        anonymousUserId: anonymousUserId,
      })

      toast.success('価格を投稿しました！')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to submit price:', error)
      toast.error('価格の投稿に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold">価格を投稿</h2>
            <p className="text-sm text-gray-600 mt-1">{store.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 商品名入力 */}
          <div>
            <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">
              商品名
            </label>
            <div className="relative">
              <input
                id="product-name"
                type="text"
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value)
                  setSelectedProduct(null)
                }}
                onBlur={() => {
                  // 少し遅延させてクリックイベントが発火するようにする
                  setTimeout(() => setShowSearchResults(false), 200)
                }}
                placeholder="例: 明治おいしい牛乳 1L"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={searchProducts}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={searching || submitting}
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* 検索結果 */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductSelect(product)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{product.name}</div>
                    {product.description && (
                      <div className="text-sm text-gray-600">{product.description}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 価格入力 */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              価格（円）
            </label>
            <input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="例: 298"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={submitting}
              min="1"
              step="1"
            />
          </div>

          {/* 送信ボタン */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}