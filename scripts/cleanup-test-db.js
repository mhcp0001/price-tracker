#!/usr/bin/env node

/**
 * テスト用データベースのクリーンアップスクリプト
 * E2Eテスト実行後にテストデータを削除する
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY are required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupTestDatabase() {
  console.log('🧹 Cleaning up test database...')

  try {
    // テーブルの順序に注意（外部キー制約のため）
    const tables = ['prices', 'products', 'stores', 'anonymous_users']
    
    for (const table of tables) {
      console.log(`🗑️ Clearing ${table} table...`)
      
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', 'never-match')  // 全レコード削除のトリック
      
      if (error) {
        console.warn(`⚠️ Warning: Failed to clear ${table}:`, error.message)
        // クリーンアップのエラーは警告に留める
      }
    }

    console.log('✅ Test database cleanup completed!')

  } catch (error) {
    console.warn('⚠️ Test database cleanup failed:', error)
    // クリーンアップのエラーは致命的ではない
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  cleanupTestDatabase()
}

module.exports = { cleanupTestDatabase }