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
    if (!mapContainer.current || !mapboxgl.accessToken) {
      console.warn('Mapbox initialization failed:', {
        container: !!mapContainer.current,
        token: !!mapboxgl.accessToken
      })
      return
    }

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
    if (!map.current || !mapLoaded || stores.length === 0) return

    // マーカーが既に作成されている場合はスキップ
    if (markers.current.length === stores.length) {
      console.log('Markers already created, skipping update')
      return
    }

    console.log('Updating store markers:', stores.length, 'stores')

    // 既存のマーカーをクリア
    markers.current.forEach(marker => {
      marker.remove()
    })
    markers.current = []

    // 新しいマーカーを追加（現在地マーカーと同じ方法で）
    stores.forEach((store, index) => {
      if (!store.location_lat || !store.location_lng) {
        console.log('Skipping store without location:', store.name)
        return
      }

      // 店舗マーカーを作成
      const storeMarker = new mapboxgl.Marker({ 
        color: '#3B82F6',
        // テスト用のdata属性を追加
        element: undefined // デフォルト要素を使用
      })
        .setLngLat([store.location_lng, store.location_lat])
        .setPopup(
          new mapboxgl.Popup({ closeOnClick: false })
            .setHTML(`<p><strong>${store.name}</strong></p>`)
        )
        .addTo(map.current!)

      // テスト用のdata属性を追加
      const markerElement = storeMarker.getElement()
      markerElement.setAttribute('data-testid', `store-marker-${index}`)
      markerElement.setAttribute('data-store-id', store.id?.toString() || index.toString())
      markerElement.setAttribute('data-store-name', store.name)

      // マーカークリック時の処理
      markerElement.addEventListener('click', () => {
        console.log('Store marker clicked:', store.name)
        onStoreSelect?.(store)
      })

      markers.current.push(storeMarker)
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
  }, [stores, mapLoaded])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" data-testid="store-map" />
      {!mapboxgl.accessToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100" data-testid="mapbox-error">
          <div className="text-center p-4">
            <p className="text-gray-500 mb-2">Mapbox access tokenが設定されていません</p>
            <p className="text-sm text-gray-400">地図機能を使用するには.envファイルでVITE_MAPBOX_ACCESS_TOKENを設定してください</p>
          </div>
        </div>
      )}
    </div>
  )
}