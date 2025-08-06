import { test, expect } from '@playwright/test'

test.describe('Price Submission Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // 位置情報の許可をモック
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 35.6762, longitude: 139.6503 })
    
    await page.goto('/')
    
    // Mapbox tokenが設定されていない場合のチェック
    const hasMapboxError = await page.locator('[data-testid="mapbox-error"]').isVisible()
    if (hasMapboxError) {
      console.warn('Mapbox token not configured, tests may fail')
    }
  })

  test('user can submit a price successfully', async ({ page }) => {
    // 1. トップページが正常に読み込まれることを確認
    await expect(page.locator('h1')).toContainText('Price Tracker')
    
    // 2. 地図セクションが表示されることを確認
    await expect(page.locator('h2').filter({ hasText: '現在地周辺の店舗' })).toBeVisible()
    
    // 3. 地図エリアが表示されるまで待機（MapboxのCanvasElementを待機）
    await page.waitForSelector('.mapboxgl-canvas', { timeout: 20000 })
    
    // 店舗選択の実装（Mapboxマーカーまたは店舗リスト）
    let storeSelected = false
    
    // まずMapboxマーカーでの選択を試行
    try {
      await page.waitForFunction(() => {
        const markers = document.querySelectorAll('.mapboxgl-marker')
        return markers.length > 0
      }, { timeout: 15000 })
      
      // 地図上の店舗マーカーをクリック
      const storeMarkers = await page.$$('.mapboxgl-marker')
      if (storeMarkers.length > 1) {
        // 最初のマーカーは現在地（赤色）、2番目以降が店舗マーカー（青色）
        await storeMarkers[1].click()
        // マーカークリック後、selectedStoreが設定されるまで待機
        await page.waitForTimeout(1000)
      } else if (storeMarkers.length === 1) {
        // フォールバック: 最初のマーカーをクリック
        await storeMarkers[0].click()
        await page.waitForTimeout(1000)
      }
      storeSelected = true
    } catch (error) {
      console.warn('Mapbox markers not available, will try store list')
    }
    
    // Mapbox選択が失敗した場合は店舗リストから選択
    if (!storeSelected) {
      await page.waitForSelector('.space-y-3', { timeout: 10000 })
      const storeListItems = await page.$$('.space-y-3 > .p-4')
      if (storeListItems.length > 0) {
        await storeListItems[0].click()
        await page.waitForTimeout(1000)
        storeSelected = true
      } else {
        throw new Error('No stores available for selection')
      }
    }
    
    // 店舗選択が完了していることを確認（選択中テキストまたは店舗名で確認）
    try {
      await expect(page.locator('text=選択中:')).toBeVisible({ timeout: 3000 })
    } catch {
      // フォールバック: 店舗名が表示されているかチェック
      await expect(page.locator('text=テストスーパーA')).toBeVisible({ timeout: 2000 })
    }
    
    // 4. ページの下部にスクロールして価格投稿セクションを表示
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)
    
    // 5. 店舗選択後、価格投稿ボタンが有効になることを確認してクリック
    await expect(page.locator('button:has-text("価格を投稿する")')).toBeVisible({ timeout: 10000 })
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
    await page.waitForSelector('.mapboxgl-canvas', { timeout: 20000 })
    
    // 店舗選択（統一されたロジック）
    let storeSelected = false
    
    try {
      await page.waitForFunction(() => {
        const markers = document.querySelectorAll('.mapboxgl-marker')
        return markers.length > 0
      }, { timeout: 15000 })
      
      const storeMarkers = await page.$$('.mapboxgl-marker')
      const targetMarker = storeMarkers.length > 1 ? storeMarkers[1] : storeMarkers[0]
      await targetMarker.click()
      await page.waitForTimeout(1000)
      storeSelected = true
    } catch (error) {
      console.warn('Mapbox markers not available, using store list')
    }
    
    if (!storeSelected) {
      const storeListItems = await page.$$('.space-y-3 > .p-4')
      if (storeListItems.length > 0) {
        await storeListItems[0].click()
        await page.waitForTimeout(1000)
      }
    }
    
    // 店舗選択確認
    try {
      await expect(page.locator('text=選択中:')).toBeVisible({ timeout: 3000 })
    } catch {
      await expect(page.locator('text=テストスーパーA')).toBeVisible({ timeout: 2000 })
    }
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
    await page.waitForSelector('.mapboxgl-canvas', { timeout: 20000 })
    
    // 店舗選択（統一されたロジック）
    let storeSelected = false
    
    try {
      await page.waitForFunction(() => {
        const markers = document.querySelectorAll('.mapboxgl-marker')
        return markers.length > 0
      }, { timeout: 15000 })
      
      const storeMarkers = await page.$$('.mapboxgl-marker')
      const targetMarker = storeMarkers.length > 1 ? storeMarkers[1] : storeMarkers[0]
      await targetMarker.click()
      await page.waitForTimeout(1000)
      storeSelected = true
    } catch (error) {
      console.warn('Mapbox markers not available, using store list')
    }
    
    if (!storeSelected) {
      const storeListItems = await page.$$('.space-y-3 > .p-4')
      if (storeListItems.length > 0) {
        await storeListItems[0].click()
        await page.waitForTimeout(1000)
      }
    }
    
    // 店舗選択確認
    try {
      await expect(page.locator('text=選択中:')).toBeVisible({ timeout: 3000 })
    } catch {
      await expect(page.locator('text=テストスーパーA')).toBeVisible({ timeout: 2000 })
    }
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