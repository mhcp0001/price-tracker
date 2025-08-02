import { supabase } from './supabase'

export class AnonymousUserService {
  private static STORAGE_KEY = 'price-tracker-user-id'
  
  static getAnonymousUserId(): string {
    let userId = localStorage.getItem(this.STORAGE_KEY)
    
    if (!userId) {
      userId = crypto.randomUUID()
      localStorage.setItem(this.STORAGE_KEY, userId)
      
      // Supabaseに匿名ユーザー作成（エラーは無視）
      this.createAnonymousUser(userId).catch(console.error)
    }
    
    return userId
  }
  
  private static async createAnonymousUser(userId: string) {
    try {
      await supabase.from('anonymous_users').insert({
        id: userId,
        display_name: `ユーザー${userId.slice(0, 8)}`,
      })
    } catch (error) {
      // 既に存在する場合はエラーを無視
      console.log('Anonymous user creation error (ignored):', error)
    }
  }
  
  static generateFingerprint(): string {
    // 簡易的なブラウザフィンガープリント
    return btoa([
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
    ].join('|'))
  }
  
  static clearUserId(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }
}