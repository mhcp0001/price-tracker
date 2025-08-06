/**
 * Supabaseデータベースの状況を確認するスクリプト
 * 商品データ、価格データ、店舗データの存在確認を行う
 */

import { createClient } from '@supabase/supabase-js';

// Supabase接続情報
const SUPABASE_URL = 'https://fxaricpzadajxcdszonn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4YXJpY3B6YWRhanhjZHN6b25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE4NzEsImV4cCI6MjA2OTc1Nzg3MX0.OCiUDxf6yC5gjt_2cEG-e2VAMO5BzX9P-fDOHNTjnbA';

// Supabaseクライアント作成
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabaseStatus() {
  console.log('🔍 Supabaseデータベース状況確認開始...\n');

  try {
    // 1. productsテーブルの確認
    console.log('📦 productsテーブルの確認...');
    const { data: products, error: productsError, count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact' });

    if (productsError) {
      console.error('❌ productsテーブルエラー:', productsError.message);
    } else {
      console.log(`✅ productsテーブル: ${productsCount}件のレコードが存在`);
      if (products && products.length > 0) {
        console.log('📋 商品データのサンプル（最初の3件）:');
        products.slice(0, 3).forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name} (ID: ${product.id})`);
          console.log(`     カテゴリ: ${product.category || '未設定'}`);
          console.log(`     JANコード: ${product.jan_code || '未設定'}`);
          console.log(`     作成日: ${new Date(product.created_at).toLocaleString('ja-JP')}`);
          console.log('');
        });
      }
    }

    // 2. pricesテーブルの確認
    console.log('\n💰 pricesテーブルの確認...');
    const { data: prices, error: pricesError, count: pricesCount } = await supabase
      .from('prices')
      .select('*', { count: 'exact' });

    if (pricesError) {
      console.error('❌ pricesテーブルエラー:', pricesError.message);
    } else {
      console.log(`✅ pricesテーブル: ${pricesCount}件のレコードが存在`);
      if (prices && prices.length > 0) {
        console.log('📋 価格データのサンプル（最初の3件）:');
        prices.slice(0, 3).forEach((price, index) => {
          console.log(`  ${index + 1}. 商品ID: ${price.product_id}, 店舗ID: ${price.store_id}`);
          console.log(`     価格: ¥${price.price}`);
          console.log(`     記録日: ${new Date(price.created_at).toLocaleString('ja-JP')}`);
          console.log('');
        });
      }
    }

    // 3. storesテーブルの確認
    console.log('\n🏪 storesテーブルの確認...');
    const { data: stores, error: storesError, count: storesCount } = await supabase
      .from('stores')
      .select('*', { count: 'exact' });

    if (storesError) {
      console.error('❌ storesテーブルエラー:', storesError.message);
    } else {
      console.log(`✅ storesテーブル: ${storesCount}件のレコードが存在`);
      if (stores && stores.length > 0) {
        console.log('📋 店舗データのサンプル（最初の3件）:');
        stores.slice(0, 3).forEach((store, index) => {
          console.log(`  ${index + 1}. ${store.name} (ID: ${store.id})`);
          console.log(`     住所: ${store.address || '未設定'}`);
          if (store.location) {
            console.log(`     位置情報: あり (Geography型)`);
          } else {
            console.log(`     位置情報: 未設定`);
          }
          console.log('');
        });
      }
    }

    // 4. 関連データの統計情報
    console.log('\n📊 データベース統計情報:');
    console.log(`商品数: ${productsCount || 0}件`);
    console.log(`価格記録数: ${pricesCount || 0}件`);
    console.log(`店舗数: ${storesCount || 0}件`);

    // 5. 商品と価格の関連情報
    if (productsCount > 0 && pricesCount > 0) {
      console.log('\n🔗 商品と価格の関連データ確認...');
      const { data: productsWithPrices, error: joinError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          prices (
            id,
            price,
            store_id,
            created_at
          )
        `)
        .limit(3);

      if (joinError) {
        console.error('❌ 関連データ取得エラー:', joinError.message);
      } else if (productsWithPrices && productsWithPrices.length > 0) {
        console.log('📋 商品と価格の関連データ:');
        productsWithPrices.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name}`);
          if (product.prices && product.prices.length > 0) {
            console.log(`     価格記録数: ${product.prices.length}件`);
            product.prices.slice(0, 2).forEach((price, priceIndex) => {
              console.log(`       ${priceIndex + 1}. ¥${price.price} (店舗ID: ${price.store_id})`);
            });
          } else {
            console.log('     価格記録: なし');
          }
          console.log('');
        });
      }
    }

    console.log('✅ データベース状況確認完了');

  } catch (error) {
    console.error('❌ データベース接続エラー:', error);
  }
}

// スクリプト実行
checkDatabaseStatus();