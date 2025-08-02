import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...')
  
  // テスト用データベースのセットアップ
  if (process.env.SUPABASE_SERVICE_KEY && process.env.SUPABASE_URL) {
    try {
      console.log('📋 Setting up test database...')
      
      // ここでテストデータをセットアップ
      // 実際の実装では scripts/setup-test-db.js を呼び出す
      const { execSync } = require('child_process')
      execSync('npm run test:setup', { stdio: 'inherit' })
      
      console.log('✅ Test database setup completed')
    } catch (error) {
      console.error('❌ Failed to setup test database:', error)
      throw error
    }
  }

  // ブラウザを起動してアプリケーションが正常に動作することを確認
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    console.log('🌐 Verifying application is accessible...')
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:4173')
    await page.waitForSelector('body', { timeout: 30000 })
    console.log('✅ Application is accessible')
  } catch (error) {
    console.error('❌ Application is not accessible:', error)
    throw error
  } finally {
    await browser.close()
  }

  console.log('🎉 E2E test environment setup completed')
}

export default globalSetup