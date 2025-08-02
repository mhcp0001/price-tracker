import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, useState } from 'react'
import type { Store } from '@/lib/types'

// Mapbox設定
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''

interface StoreMapProps {
  stores: Store[]
  center: { lat: number; lng: number }
  onStoreSelect?: (store: Store) => void
}

export const StoreMap = ({ stores, center, onStoreSelect }: StoreMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)

  // マップの初期化
  useEffect(() => {
    if (!mapContainer.current || !mapboxgl.accessToken) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom: 14,
    })

    // 現在位置マーカー
    new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([center.lng, center.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<p>現在地</p>'))
      .addTo(map.current)

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    // ナビゲーションコントロール追加
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    
    // ジオロケーションコントロール追加
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    )

    return () => {
      map.current?.remove()
    }
  }, [center])

  // 店舗マーカーの更新
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // 既存のマーカーをクリア
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    // 新しいマーカーを追加
    stores.forEach(store => {
      if (!store.location_lat || !store.location_lng) return

      const el = document.createElement('div')
      el.className = 'store-marker'
      el.style.width = '30px'
      el.style.height = '30px'
      el.style.backgroundImage = 'url(data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233B82F6"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E)'
      el.style.backgroundSize = 'cover'
      el.style.cursor = 'pointer'

      const marker = new mapboxgl.Marker(el)
        .setLngLat([store.location_lng, store.location_lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <h3 class="font-bold">${store.name}</h3>
              ${store.distance_meters ? `<p class="text-sm">${store.distance_meters}m</p>` : ''}
              ${store.address ? `<p class="text-xs text-gray-600">${store.address}</p>` : ''}
            </div>
          `)
        )
        .addTo(map.current!)

      el.addEventListener('click', () => {
        if (onStoreSelect) {
          onStoreSelect(store)
        }
      })

      markers.current.push(marker)
    })

    // すべてのマーカーが見えるように調整
    if (stores.length > 0 && stores.some(s => s.location_lat && s.location_lng)) {
      const bounds = new mapboxgl.LngLatBounds()
      
      // 現在地を含める
      bounds.extend([center.lng, center.lat])
      
      // 店舗の位置を含める
      stores.forEach(store => {
        if (store.location_lat && store.location_lng) {
          bounds.extend([store.location_lng, store.location_lat])
        }
      })

      map.current.fitBounds(bounds, { padding: 50 })
    }
  }, [stores, mapLoaded, center, onStoreSelect])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapboxgl.accessToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Mapbox access tokenが設定されていません</p>
        </div>
      )}
    </div>
  )
}