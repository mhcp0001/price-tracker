import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...')
  
  // テストデータのクリーンアップ
  if (process.env.SUPABASE_SERVICE_KEY && process.env.SUPABASE_URL) {
    try {
      console.log('🗑️ Cleaning up test database...')
      
      // テストデータの削除処理
      // 実際の実装では scripts/cleanup-test-db.js を呼び出す
      const { execSync } = require('child_process')
      execSync('npm run test:cleanup', { stdio: 'inherit' })
      
      console.log('✅ Test database cleanup completed')
    } catch (error) {
      console.warn('⚠️ Failed to cleanup test database:', error)
      // teardownでのエラーはテスト失敗にしない
    }
  }

  console.log('✨ E2E test environment cleanup completed')
}

export default globalTeardown