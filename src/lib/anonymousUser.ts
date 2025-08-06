import { supabase } from './supabase'

export class AnonymousUserService {
  private static STORAGE_KEY = 'price-tracker-user-id'
  
  static async getAnonymousUserId(): Promise<string> {
    let userId = localStorage.getItem(this.STORAGE_KEY)
    
    if (!userId) {
      userId = crypto.randomUUID()
      localStorage.setItem(this.STORAGE_KEY, userId)
    }
    
    // 常に作成を試みる（既に存在する場合はエラーを無視）
    await this.createAnonymousUser(userId)
    
    return userId
  }
  
  private static async createAnonymousUser(userId: string) {
    const { error } = await supabase.from('anonymous_users').insert({
      id: userId,
      display_name: `ユーザー${userId.slice(0, 8)}`,
    }).select()
    
    if (error) {
      // 409エラー（既に存在）の場合は無視、それ以外はログ出力
      if (error.code !== '23505') { // unique_violation
        console.log('Anonymous user creation error:', error)
      }
    } else {
      console.log('Anonymous user created:', userId)
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