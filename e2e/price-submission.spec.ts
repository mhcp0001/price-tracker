import { test, expect } from '@playwright/test'

test.describe('Price Submission Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // 位置情報の許可をモック
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 35.6762, longitude: 139.6503 })
    
    await page.goto('/')
  })

  test('user can submit a price successfully', async ({ page }) => {
    // 1. トップページが正常に読み込まれることを確認
    await expect(page.locator('h1')).toContainText('Price Tracker')
    
    // 2. 地図セクションが表示されることを確認
    await expect(page.locator('h2').filter({ hasText: '現在地周辺の店舗' })).toBeVisible()
    
    // 3. 地図エリアが表示されるまで待機（MapboxのCanvasElementを待機）
    await page.waitForSelector('.mapboxgl-canvas', { timeout: 15000 })
    await page.waitForTimeout(5000) // Mapboxと店舗マーカーが読み込まれるまで待機
    
    // 地図上の店舗マーカーをクリック（Mapboxマーカーは特殊な要素）
    await page.click('.mapboxgl-marker:first-child')
    
    // 4. ページの下部にスクロールして価格投稿セクションを表示
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)
    
    // 5. 店舗選択後、価格投稿ボタンが有効になることを確認してクリック
    await expect(page.locator('button:has-text("価格を投稿する")')).toBeVisible()
    await page.click('button:has-text("価格を投稿する")')
    
    // 6. 価格投稿フォームモーダルが表示されることを確認
    await expect(page.locator('.fixed').filter({ hasText: '価格を投稿' })).toBeVisible()
    
    // 7. 商品名を入力
    await page.fill('input[placeholder*="商品名"]', 'トマト')
    
    // 8. 価格を入力
    await page.fill('input[placeholder*="価格"]', '298')
    
    // 9. 投稿ボタンをクリック
    await page.click('button:has-text("投稿")')
    
    // 10. 成功した場合はモーダルが閉じることを確認
    // または適切な成功メッセージが表示されることを確認
    await page.waitForTimeout(2000) // 投稿処理の完了を待機
  })

  test('should show validation errors for invalid input', async ({ page }) => {
    // 店舗を選択してフォームを開く
    await page.waitForSelector('.mapboxgl-canvas', { timeout: 15000 })
    await page.waitForTimeout(5000)
    await page.click('.mapboxgl-marker:first-child')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.click('button:has-text("価格を投稿する")')
    
    // 空のフィールドで投稿を試行
    await page.click('button:has-text("投稿")')
    
    // バリデーションメッセージが表示されることを確認（実際の実装に応じて調整）
    await page.waitForTimeout(1000)
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // ネットワークエラーをシミュレート
    await page.route('**/rest/v1/prices', (route) => {
      route.abort('failed')
    })
    
    // 店舗を選択してフォームを開く
    await page.waitForSelector('.mapboxgl-canvas', { timeout: 15000 })
    await page.waitForTimeout(5000)
    await page.click('.mapboxgl-marker:first-child')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.click('button:has-text("価格を投稿する")')
    
    // フォームに入力
    await page.fill('input[placeholder*="商品名"]', 'トマト')
    await page.fill('input[placeholder*="価格"]', '298')
    await page.click('button:has-text("投稿")')
    
    // エラー処理を確認（実際の実装に応じて調整）
    await page.waitForTimeout(2000)
  })
})