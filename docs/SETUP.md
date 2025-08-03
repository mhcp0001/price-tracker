# Price Tracker MVP セットアップガイド

## 概要
Price Trackerは、スーパーマーケットの商品価格を追跡・共有するためのWebアプリケーションです。

## 必要な環境
- Node.js 18以上
- npm または pnpm
- Supabaseアカウント
- Mapboxアカウント

## セットアップ手順

### 1. リポジトリのクローン
```bash
git clone [repository-url]
cd price-tracker
npm install
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://app.supabase.com)にログイン
2. 新しいプロジェクトを作成
3. プロジェクトの設定から以下の情報を取得：
   - Project URL
   - Anon API Key

### 3. データベースの初期化

1. Supabaseダッシュボードの「SQL Editor」を開く
2. `supabase/00_complete_setup.sql`の内容を全てコピー
3. SQL Editorに貼り付けて「RUN」を実行

このSQLファイルには以下が含まれています：
- PostGIS拡張の有効化
- 全テーブルの作成
- インデックスの作成
- ビューと関数の作成
- RLSポリシーの設定
- 初期データの投入

### 4. Mapboxアカウントの設定

1. [Mapbox](https://www.mapbox.com/)にログイン
2. Access Tokenを作成または取得

### 5. 環境変数の設定

`.env`ファイルを作成し、以下の内容を設定：

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Mapbox Configuration
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

### 6. アプリケーションの起動

```bash
npm run dev
```

ブラウザで`http://localhost:5173`を開く

## 機能確認

### 基本機能
1. **位置情報の許可**: ブラウザが位置情報の許可を求めたら「許可」をクリック
2. **地図表示**: 現在地と周辺の店舗が地図上に表示される
3. **店舗選択**: 地図のマーカーまたはリストから店舗を選択
4. **価格投稿**: 
   - 店舗を選択後「価格を投稿する」ボタンをクリック
   - 商品名と価格を入力
   - 「投稿する」ボタンで保存

### データベース構造

#### テーブル
- `anonymous_users`: 匿名ユーザー管理
- `stores`: 店舗情報
- `products`: 商品マスタ
- `prices`: 価格履歴

#### 主要な関数
- `get_nearby_stores()`: 近隣店舗検索（デフォルト2km範囲）
- `search_products()`: 商品検索（日本語対応）

## トラブルシューティング

### 価格投稿ができない場合
1. ブラウザのコンソールでエラーを確認
2. Supabaseの「Table Editor」で`anonymous_users`テーブルを確認
3. RLSポリシーが正しく設定されているか確認

### 地図が表示されない場合
1. Mapbox Access Tokenが正しいか確認
2. ブラウザの位置情報許可を確認
3. HTTPSまたはlocalhostでアクセスしているか確認

### 店舗が表示されない場合
1. 現在地の2km範囲内に店舗データがあるか確認
2. Supabaseの`stores`テーブルにデータが存在するか確認
3. 位置情報（緯度・経度）が正しく設定されているか確認

## 開発環境

### 使用技術
- **フロントエンド**: React + TypeScript + Vite
- **スタイリング**: Tailwind CSS
- **地図**: Mapbox GL JS
- **データベース**: Supabase (PostgreSQL + PostGIS)
- **状態管理**: React Hooks

### プロジェクト構成
```
price-tracker/
├── src/
│   ├── components/     # UIコンポーネント
│   ├── lib/            # ユーティリティ・サービス
│   ├── pages/          # ページコンポーネント
│   └── App.tsx         # メインアプリケーション
├── supabase/
│   └── 00_complete_setup.sql  # データベース初期化SQL
├── .env                # 環境変数
└── package.json        # 依存関係
```

## 本番環境へのデプロイ

### Vercel
1. GitHubリポジトリと連携
2. 環境変数を設定
3. デプロイ

### 環境変数（本番用）
```env
VITE_SUPABASE_URL=https://production-project.supabase.co
VITE_SUPABASE_ANON_KEY=production-anon-key
VITE_MAPBOX_ACCESS_TOKEN=production-mapbox-token
```

## ライセンス
MIT