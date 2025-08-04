import { test, expect } from '@playwright/test'

test.describe('Price Submission Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 位置情報の許可をモック
    await page.context().grantPermissions(['geolocation'])
    await page.setGeolocation({ latitude: 35.6762, longitude: 139.6503 })
    
    await page.goto('/')
  })

  test('user can submit a price successfully', async ({ page }) => {
    // 1. トップページが正常に読み込まれることを確認
    await expect(page.locator('h1')).toContainText('Price Tracker')
    
    // 2. 地図が表示されることを確認
    await expect(page.locator('[data-testid="store-map"]')).toBeVisible()
    
    // 3. 価格投稿ボタンをクリック
    await page.click('[data-testid="submit-price-button"]')
    
    // 4. 価格投稿フォームが表示されることを確認  
    await expect(page.locator('[data-testid="price-form"]')).toBeVisible()
    
    // 5. 商品名を入力
    await page.fill('[data-testid="product-name"]', 'トマト')
    
    // 6. オートコンプリートが表示されることを確認
    await expect(page.locator('[data-testid="autocomplete-list"]')).toBeVisible()
    
    // 7. 価格を入力
    await page.fill('[data-testid="price-input"]', '298')
    
    // 8. 店舗を選択（地図上のマーカーをクリック）
    await page.click('[data-testid="store-marker-1"]')
    
    // 9. 選択された店舗が表示されることを確認
    await expect(page.locator('[data-testid="selected-store"]')).toContainText('テストスーパーA')
    
    // 10. 投稿ボタンをクリック
    await page.click('[data-testid="submit-button"]')
    
    // 11. 投稿中のローディング表示を確認
    await expect(page.locator('[data-testid="submitting"]')).toBeVisible()
    
    // 12. 成功メッセージが表示されることを確認
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('価格を投稿しました')
    
    // 13. フォームがリセットされることを確認
    await expect(page.locator('[data-testid="product-name"]')).toHaveValue('')
    await expect(page.locator('[data-testid="price-input"]')).toHaveValue('')
  })

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.click('[data-testid="submit-price-button"]')
    
    // 空の商品名で投稿を試行
    await page.click('[data-testid="submit-button"]')
    
    // バリデーションエラーが表示されることを確認
    await expect(page.locator('[data-testid="product-name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-name-error"]')).toContainText('商品名を入力してください')
    
    // 商品名を入力して価格を空にして投稿を試行
    await page.fill('[data-testid="product-name"]', 'トマト')
    await page.click('[data-testid="submit-button"]')
    
    await expect(page.locator('[data-testid="price-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="price-error"]')).toContainText('価格を入力してください')
    
    // 無効な価格（負の値）を入力
    await page.fill('[data-testid="price-input"]', '-100')
    await page.click('[data-testid="submit-button"]')
    
    await expect(page.locator('[data-testid="price-error"]')).toContainText('正の数値を入力してください')
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // ネットワークエラーをシミュレート
    await page.route('**/rest/v1/prices', (route) => {
      route.abort('failed')
    })
    
    await page.click('[data-testid="submit-price-button"]')
    await page.fill('[data-testid="product-name"]', 'トマト')
    await page.fill('[data-testid="price-input"]', '298')
    await page.click('[data-testid="store-marker-1"]')
    await page.click('[data-testid="submit-button"]')
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('投稿に失敗しました')
    
    // リトライボタンが表示されることを確認
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
  })
})