#!/usr/bin/env node

/**
 * テスト用データベースのセットアップスクリプト
 * E2Eテスト実行前にクリーンなテストデータを投入する
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY are required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupTestDatabase() {
  console.log('🚀 Setting up test database...')

  try {
    // 1. 既存のテストデータをクリア
    console.log('🗑️ Clearing existing test data...')
    
    await supabase.from('prices').delete().neq('id', 'never-match')
    await supabase.from('products').delete().neq('id', 'never-match')
    await supabase.from('stores').delete().neq('id', 'never-match')
    await supabase.from('anonymous_users').delete().neq('id', 'never-match')

    // 2. テスト用店舗データを投入
    console.log('🏪 Inserting test store data...')
    
    const stores = [
      {
        id: '1',
        name: 'テストスーパーA',
        chain: 'テストチェーン',
        address: '東京都渋谷区テスト1-1-1',
        location: `POINT(139.6503 35.6762)`,
        phone: '03-1234-5678',
        hours: {
          mon: '9:00-21:00',
          tue: '9:00-21:00',
          wed: '9:00-21:00',
          thu: '9:00-21:00',
          fri: '9:00-21:00',
          sat: '9:00-21:00',
          sun: '9:00-20:00'
        }
      },
      {
        id: '2',
        name: 'テストスーパーB',
        chain: 'テストチェーン',
        address: '東京都渋谷区テスト2-2-2',
        location: `POINT(139.6550 35.6800)`,
        phone: '03-2345-6789',
        hours: {
          mon: '8:00-22:00',
          tue: '8:00-22:00',
          wed: '8:00-22:00',
          thu: '8:00-22:00',
          fri: '8:00-22:00',
          sat: '8:00-22:00',
          sun: '8:00-21:00'
        }
      }
    ]

    for (const store of stores) {
      const { error } = await supabase.rpc('insert_store_with_location', {
        store_id: store.id,
        store_name: store.name,
        store_chain: store.chain,
        store_address: store.address,
        store_lng: store.id === '1' ? 139.6503 : 139.6550,
        store_lat: store.id === '1' ? 35.6762 : 35.6800,
        store_phone: store.phone,
        store_hours: store.hours
      })
      
      if (error) {
        console.error(`Failed to insert store ${store.name}:`, error)
        throw error
      }
    }

    // 3. テスト用商品データを投入
    console.log('🥬 Inserting test product data...')
    
    const products = [
      {
        id: '1',
        name: 'トマト',
        category: '野菜',
        brand: '',
        unit: '個',
        barcode: null,
        image_url: null
      },
      {
        id: '2',
        name: '牛乳',
        category: '乳製品',
        brand: '明治',
        unit: '1L',
        barcode: '4902705001234',
        image_url: '/images/milk.jpg'
      },
      {
        id: '3',
        name: '食パン',
        category: 'パン',
        brand: 'ヤマザキ',
        unit: '1斤',
        barcode: '4903110001234',
        image_url: '/images/bread.jpg'
      }
    ]

    const { error: productsError } = await supabase
      .from('products')
      .insert(products)

    if (productsError) {
      console.error('Failed to insert products:', productsError)
      throw productsError
    }

    // 4. テスト用匿名ユーザーを作成
    console.log('👤 Creating test anonymous user...')
    
    const { error: userError } = await supabase
      .from('anonymous_users')
      .insert({
        id: 'test-user-1',
        browser_fingerprint: 'test-fingerprint-123',
        submission_count: 0
      })

    if (userError) {
      console.error('Failed to create anonymous user:', userError)
      throw userError
    }

    // 5. テスト用価格データを投入
    console.log('💰 Inserting test price data...')
    
    const prices = [
      {
        id: '1',
        product_id: '1',
        store_id: '1',
        price: 298,
        unit_price: 298,
        quantity: 1,
        user_id: 'test-user-1',
        notes: 'テスト投稿'
      },
      {
        id: '2',
        product_id: '2',
        store_id: '1',
        price: 188,
        unit_price: 188,
        quantity: 1,
        user_id: 'test-user-1',
        notes: 'テスト投稿'
      },
      {
        id: '3',
        product_id: '1',
        store_id: '2',
        price: 318,
        unit_price: 318,
        quantity: 1,
        user_id: 'test-user-1',
        notes: 'テスト投稿'
      }
    ]

    const { error: pricesError } = await supabase
      .from('prices')
      .insert(prices)

    if (pricesError) {
      console.error('Failed to insert prices:', pricesError)
      throw pricesError
    }

    console.log('✅ Test database setup completed successfully!')
    
    // セットアップ結果のサマリー
    const { count: storeCount } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true })
    
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    const { count: priceCount } = await supabase
      .from('prices')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Test data summary:`)
    console.log(`   - Stores: ${storeCount}`)
    console.log(`   - Products: ${productCount}`)
    console.log(`   - Prices: ${priceCount}`)

  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
    process.exit(1)
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  setupTestDatabase()
}

module.exports = { setupTestDatabase }