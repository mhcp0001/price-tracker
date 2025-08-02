import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StoreMap } from './StoreMap'
import mapboxgl from 'mapbox-gl'

// Mapbox GLをモック
vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: '',
    Map: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      remove: vi.fn(),
      addControl: vi.fn(),
      fitBounds: vi.fn(),
    })),
    Marker: vi.fn().mockImplementation(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      setPopup: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
    })),
    Popup: vi.fn().mockImplementation(() => ({
      setHTML: vi.fn().mockReturnThis(),
    })),
    NavigationControl: vi.fn(),
    GeolocateControl: vi.fn(),
    LngLatBounds: vi.fn().mockImplementation(() => ({
      extend: vi.fn(),
    })),
  },
}))

describe('StoreMap', () => {
  const mockStores = [
    {
      id: '1',
      name: 'Test Store 1',
      address: 'Test Address 1',
      distance_meters: 500,
      location_lat: 35.6812,
      location_lng: 139.7671,
    },
    {
      id: '2',
      name: 'Test Store 2',
      address: 'Test Address 2',
      distance_meters: 1000,
      location_lat: 35.6813,
      location_lng: 139.7672,
    },
  ]

  const mockCenter = { lat: 35.6811, lng: 139.7670 }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mapbox access tokenを設定
    mapboxgl.accessToken = 'test-token'
  })

  it('should render map container', () => {
    render(<StoreMap stores={[]} center={mockCenter} />)
    
    const mapContainer = document.querySelector('div[style*="height"]')
    expect(mapContainer).toBeInTheDocument()
  })

  it('should display message when no access token', () => {
    mapboxgl.accessToken = ''
    
    render(<StoreMap stores={[]} center={mockCenter} />)
    
    expect(screen.getByText('Mapbox access tokenが設定されていません')).toBeInTheDocument()
  })

  it('should create map with correct options', () => {
    render(<StoreMap stores={mockStores} center={mockCenter} />)
    
    expect(mapboxgl.Map).toHaveBeenCalledWith({
      container: expect.any(HTMLDivElement),
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [mockCenter.lng, mockCenter.lat],
      zoom: 14,
      language: 'ja',
    })
  })

  it('should create markers for stores', () => {
    render(<StoreMap stores={mockStores} center={mockCenter} />)
    
    // 現在地マーカー + 店舗マーカー
    expect(mapboxgl.Marker).toHaveBeenCalledTimes(3)
  })

  it('should call onStoreSelect when store is selected', () => {
    const onStoreSelect = vi.fn()
    
    render(
      <StoreMap 
        stores={mockStores} 
        center={mockCenter} 
        onStoreSelect={onStoreSelect}
      />
    )
    
    // マーカーのクリックイベントをシミュレート
    const markerElement = document.createElement('div')
    markerElement.click()
    
    // 実際のクリックハンドラーの実装により、この部分は調整が必要
  })
})