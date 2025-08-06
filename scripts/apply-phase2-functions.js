/**
 * Phase2 functions をSupabaseデータベースに適用するスクリプト
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Supabase接続情報
const SUPABASE_URL = 'https://fxaricpzadajxcdszonn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4YXJpY3B6YWRhanhjZHN6b25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE4NzEsImV4cCI6MjA2OTc1Nzg3MX0.OCiUDxf6yC5gjt_2cEG-e2VAMO5BzX9P-fDOHNTjnbA';

// Service roleキーが必要（管理者権限でSQL実行のため）
// これは本来は環境変数から取得すべきですが、テスト用にハードコード
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4YXJpY3B6YWRhanhjZHN6b25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE4MTg3MSwiZXhwIjoyMDY5NzU3ODcxfQ.vhWJgOVSMCBUIDOLVT1oQyMxdKp8EGqgH8cqSBNHO7w';

// Supabaseクライアント作成（サービスロール）
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyPhase2Functions() {
  console.log('🔧 Phase2 functions をデータベースに適用開始...\n');

  try {
    // phase2-functions.sqlファイルを読み込み
    const sqlContent = readFileSync('./supabase/phase2-functions.sql', 'utf8');
    
    console.log('📖 phase2-functions.sql を読み込みました');
    
    // SQLを実行
    const { error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      console.error('❌ SQL実行エラー:', error);
      // 代替方法: 個別の関数をテスト
      console.log('🔄 代替方法で search_products_with_prices 関数をテスト...');
      
      const { data: testResult, error: testError } = await supabase
        .rpc('search_products_with_prices', {
          search_query: '牛乳',
          limit_count: 5
        });

      if (testError) {
        console.error('❌ search_products_with_prices 関数が存在しません:', testError.message);
        console.log('📝 関数を個別に作成します...');
        
        // 関数を個別に作成
        const createFunctionSQL = `
CREATE OR REPLACE FUNCTION search_products_with_prices(
  search_query text DEFAULT NULL,
  limit_count integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  jan_code text,
  min_price integer,
  max_price integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.jan_code,
    MIN(lp.price)::integer as min_price,
    MAX(lp.price)::integer as max_price
  FROM products p
  LEFT JOIN latest_prices lp ON p.id = lp.product_id
  WHERE 
    search_query IS NULL 
    OR p.name ILIKE '%' || search_query || '%'
  GROUP BY p.id, p.name, p.description, p.jan_code
  ORDER BY 
    CASE WHEN search_query IS NOT NULL 
      THEN similarity(p.name, search_query) 
      ELSE 0 
    END DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
        `;

        // SQL実行を試行
        console.log('🔧 関数を個別作成中...');
        // 注意: 実際のSupabaseではDDLは管理コンソールまたはmigrationで行う必要があります
        console.log('⚠️  関数の作成はSupabase管理コンソールで行ってください');
        console.log('📝 実行するSQL:');
        console.log(createFunctionSQL);
        
      } else {
        console.log('✅ search_products_with_prices 関数は正常に動作しています');
        console.log('📋 テスト結果:');
        console.log(testResult);
      }
    } else {
      console.log('✅ Phase2 functions が正常に適用されました');
      
      // 関数のテスト実行
      console.log('🧪 search_products_with_prices 関数をテスト...');
      const { data: testResult, error: testError } = await supabase
        .rpc('search_products_with_prices', {
          search_query: '牛乳',
          limit_count: 5
        });

      if (testError) {
        console.error('❌ 関数テストエラー:', testError.message);
      } else {
        console.log('✅ 関数テスト成功');
        console.log('📋 検索結果 ("牛乳"):');
        console.log(testResult);
      }
    }

    console.log('\n✅ Phase2 functions 適用処理完了');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

// スクリプト実行
applyPhase2Functions();