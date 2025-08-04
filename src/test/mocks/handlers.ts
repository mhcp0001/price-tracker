import { http, HttpResponse } from 'msw'

const SUPABASE_URL = 'https://test.supabase.co'

export const handlers = [
  // Supabase RPC: get_nearby_stores
  http.post(`${SUPABASE_URL}/rest/v1/rpc/get_nearby_stores`, () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'テストスーパーA',
        distance_meters: 500,
        location_lat: 35.6762,
        location_lng: 139.6503,
      },
      {
        id: '2', 
        name: 'テストスーパーB',
        distance_meters: 800,
        location_lat: 35.6800,
        location_lng: 139.6550,
      },
    ])
  }),

  // Supabase: stores table
  http.get(`${SUPABASE_URL}/rest/v1/stores`, () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'テストスーパーA',
        chain: 'テストチェーン',
        address: '東京都渋谷区テスト1-1-1',
        phone: '03-1234-5678',
        hours: { mon: '9:00-21:00', tue: '9:00-21:00' },
      },
    ])
  }),

  // Supabase: products table  
  http.get(`${SUPABASE_URL}/rest/v1/products`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    
    const products = [
      {
        id: '1',
        name: 'トマト',
        category: '野菜',
        brand: '',
        unit: '個',
        barcode: null,
        image_url: null,
      },
      {
        id: '2',
        name: '牛乳',
        category: '乳製品',
        brand: '明治',
        unit: '1L',
        barcode: '4902705001234',
        image_url: '/images/milk.jpg',
      },
    ]

    if (search) {
      const filtered = products.filter((p) =>
        p.name.includes(search) || p.brand?.includes(search) || ''
      )
      return HttpResponse.json(filtered)
    }

    return HttpResponse.json(products)
  }),

  // Supabase: prices table
  http.get(`${SUPABASE_URL}/rest/v1/prices`, () => {
    return HttpResponse.json([
      {
        id: '1',
        product_id: '1',
        store_id: '1',
        price: 298,
        unit_price: 298,
        quantity: 1,
        user_id: 'anonymous-user-1',
        submitted_at: '2024-01-15T10:30:00Z',
        verified_at: null,
        is_verified: false,
        notes: null,
      },
      {
        id: '2',
        product_id: '2', 
        store_id: '1',
        price: 188,
        unit_price: 188,
        quantity: 1,
        user_id: 'anonymous-user-1',
        submitted_at: '2024-01-15T11:00:00Z',
        verified_at: null,
        is_verified: false,
        notes: null,
      },
    ])
  }),

  // Supabase: price submission
  http.post(`${SUPABASE_URL}/rest/v1/prices`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    
    return HttpResponse.json({
      id: 'new-price-id',
      ...body,
      submitted_at: new Date().toISOString(),
      is_verified: false,
    }, { status: 201 })
  }),

  // Supabase: anonymous users
  http.post(`${SUPABASE_URL}/rest/v1/anonymous_users`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    
    return HttpResponse.json({
      ...body,
      created_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      submission_count: 0,
    }, { status: 201 })
  }),

  // Mapbox Geocoding API (テスト用)
  http.get('https://api.mapbox.com/geocoding/v5/mapbox.places/*', () => {
    return HttpResponse.json({
      type: 'FeatureCollection',
      features: [
        {
          id: 'place.1',
          type: 'Feature',
          place_name: '東京都渋谷区, Japan',
          geometry: {
            type: 'Point',
            coordinates: [139.6503, 35.6762],
          },
          properties: {},
        },
      ],
    })
  }),

  // Mapbox Static Images API (テスト用)
  http.get('https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/*', () => {
    // 1x1 pixel transparent PNG
    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    )
    return new HttpResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
      },
    })
  }),
]