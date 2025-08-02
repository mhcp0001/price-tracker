import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import HomePage from './HomePage'
import { DatabaseService } from '@/lib/database'

// モック
vi.mock('@/lib/database')
vi.mock('@/components/maps/StoreMap', () => ({
  StoreMap: ({ stores, onStoreSelect }: any) => (
    <div data-testid="store-map">
      {stores.map((store: any) => (
        <div key={store.id} onClick={() => onStoreSelect?.(store)}>
          {store.name}
        </div>
      ))}
    </div>
  ),
}))
vi.mock('@/components/forms/PriceSubmissionForm', () => ({
  PriceSubmissionForm: ({ store, onClose }: any) => (
    <div data-testid="price-form">
      Price form for {store.name}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

describe('HomePage', () => {
  const mockStores = [
    {
      id: '1',
      name: 'スーパーマルエツ',
      address: '東京都渋谷区',
      distance_meters: 500,
    },
    {
      id: '2',
      name: 'イトーヨーカドー',
      address: '東京都新宿区',
      distance_meters: 1000,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Geolocation APIをモック
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 35.6812,
            longitude: 139.7671,
          },
        })
      }),
    }
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
    })
  })

  const renderHomePage = () => {
    return render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )
  }

  it('should render header with title', () => {
    renderHomePage()
    
    expect(screen.getByText('Price Tracker')).toBeInTheDocument()
  })

  it('should get user location on mount', async () => {
    vi.mocked(DatabaseService.getNearbyStores).mockResolvedValue(mockStores)
    
    renderHomePage()
    
    await waitFor(() => {
      expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled()
    })
  })

  it('should fetch nearby stores when location is available', async () => {
    vi.mocked(DatabaseService.getNearbyStores).mockResolvedValue(mockStores)
    
    renderHomePage()
    
    await waitFor(() => {
      expect(DatabaseService.getNearbyStores).toHaveBeenCalledWith(
        35.6812,
        139.7671,
        2000
      )
    })
  })

  it('should display store list', async () => {
    vi.mocked(DatabaseService.getNearbyStores).mockResolvedValue(mockStores)
    
    renderHomePage()
    
    await waitFor(() => {
      expect(screen.getByText('スーパーマルエツ')).toBeInTheDocument()
      expect(screen.getByText('イトーヨーカドー')).toBeInTheDocument()
    })
  })

  it('should select store when clicked', async () => {
    vi.mocked(DatabaseService.getNearbyStores).mockResolvedValue(mockStores)
    const user = userEvent.setup()
    
    renderHomePage()
    
    await waitFor(() => {
      expect(screen.getByText('スーパーマルエツ')).toBeInTheDocument()
    })
    
    const storeElement = screen.getByText('スーパーマルエツ').closest('div[class*="cursor-pointer"]')
    await user.click(storeElement!)
    
    expect(screen.getByText('選択中: スーパーマルエツ')).toBeInTheDocument()
  })

  it('should open price form when submit button is clicked', async () => {
    vi.mocked(DatabaseService.getNearbyStores).mockResolvedValue(mockStores)
    const user = userEvent.setup()
    
    renderHomePage()
    
    await waitFor(() => {
      expect(screen.getByText('スーパーマルエツ')).toBeInTheDocument()
    })
    
    // 店舗を選択
    const storeElement = screen.getByText('スーパーマルエツ').closest('div[class*="cursor-pointer"]')
    await user.click(storeElement!)
    
    // 価格投稿ボタンをクリック
    const submitButton = screen.getByText('価格を投稿する')
    await user.click(submitButton)
    
    expect(screen.getByTestId('price-form')).toBeInTheDocument()
  })

  it('should show error message when location is denied', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((_, error) => {
        error({ code: 1, message: 'User denied' })
      }),
    }
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
    })
    
    renderHomePage()
    
    await waitFor(() => {
      expect(screen.getByText('位置情報の取得に失敗しました')).toBeInTheDocument()
    })
  })
})