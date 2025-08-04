# Price Tracker PWA

**スーパーマーケット価格追跡PWA** - 超軽量MVP戦略で開発中

地域のスーパーマーケット価格を追跡・比較できるプログレッシブWebアプリです。**Supabase BaaS**と**包括的テストインフラ**により、個人開発でありながらエンタープライズ級の品質を実現しています。

## 🎯 MVP戦略

**超軽量MVP**: 1-2週間での価値提供を目指し、段階的に機能を拡張

### 🚀 Phase 0: 超軽量MVP (実装中)
- **🗺️ 地図ベース店舗表示**: 現在位置周辺のスーパーマーケット表示
- **💰 価格投稿・表示**: 匿名ユーザーによる価格情報の投稿と閲覧
- **🔍 商品検索**: シンプルな商品名検索とオートコンプリート
- **📱 PWA機能**: オフライン対応とホーム画面インストール

### 📈 段階的拡張計画
1. **Phase 1**: ユーザー認証・データ品質向上・ゲーミフィケーション
2. **Phase 2**: OCRレシート読取・単位価格正規化・簡易最適化機能  
3. **Phase 3**: 買い物リスト最適化・リアルタイム価格比較

## 📁 プロジェクト構造

```
price-tracker/
├── .claude/                 # Claude Code設定ファイル
│   ├── CLAUDE.md           # プロジェクト固有ガイドライン
│   ├── settings.json       # 共通設定（チーム共有）
│   └── settings.local.json # 個人設定（ローカル専用）
├── .tmp/                   # 仕様書（開発フェーズ成果物）
│   ├── requirements.md     # 要件定義書（221行）
│   ├── design.md          # 技術設計書（1,925行）
│   └── tasks.md           # 実装タスクリスト（609行）
├── src/                    # アプリケーションソースコード（実装時作成）
│   ├── frontend/          # React PWA フロントエンド
│   ├── backend/           # Node.js API バックエンド
│   └── shared/            # 共通型定義・ユーティリティ
├── docs/                   # プロジェクトドキュメント
├── docker/                # Docker設定ファイル
└── README.md              # このファイル
```

## 🏗️ 技術スタック

### 🎨 フロントエンド
- **React 18** + TypeScript + Vite
- **Tailwind CSS** - ユーティリティファーストCSS  
- **Zustand** - 軽量状態管理
- **Mapbox GL JS** - 地図機能
- **PWA (Vite Plugin)** - Service Worker + Manifest

### 🔧 バックエンド (BaaS)
- **Supabase** - オールインワンBaaS
  - PostgreSQL + PostGIS (地理的検索)
  - 自動生成REST API + GraphQL
  - リアルタイム機能 (WebSocket)
  - 認証システム (Phase 1で追加)
  - ファイルストレージ + Edge Functions

### 🧪 テストインフラ
- **Unit/Integration**: Vitest + React Testing Library + MSW
- **E2E Testing**: Playwright (モバイルエミュレーション対応)
- **Performance**: Lighthouse CI (PWA + アクセシビリティ)
- **CI/CD**: GitHub Actions (並列実行最適化)

### 🚀 インフラ・デプロイ
- **Frontend**: Vercel/Netlify (PWA最適化)
- **Backend**: Supabase Managed (フルマネージド)
- **Monitoring**: GitHub Actions + Slack通知

## 🚀 戦略的転換点

このプロジェクトは**Gemini AI**との包括的相談により、根本的な戦略転換を実施しました：

### 📊 開発効率の劇的改善
| 項目 | 従来計画 | MVP戦略 | 改善効果 |
|------|---------|---------|---------|
| **開発期間** | 6-8週間 | 1-2週間 | **75%短縮** |
| **初期コスト** | $25-50/月 | 無料 | **100%削減** |
| **実装工数** | 28タスク | 10タスク | **65%削減** |
| **価値提供** | Phase 2完了後 | 即座 | **6週間前倒し** |

### 🏗️ アーキテクチャ転換  
- **従来**: Express + PostgreSQL フルスタック開発
- **新戦略**: Supabase BaaS + React PWA
- **効果**: バックエンド開発工数99%削減、自動API生成

### 🧪 テスト駆動品質保証
- **包括的CI/CD**: GitHub Actions並列パイプライン  
- **多層テスト**: Unit + Integration + E2E + Performance
- **品質ゲート**: TypeScript + ESLint + Coverage + PWA準拠
- **個人開発**: エンタープライズ級品質インフラ

## 📚 開発仕様書

このプロジェクトは**仕様駆動開発**方式で進められており、以下の詳細な仕様書が作成されています：

### 📋 `.tmp/requirements.md` (221行)
**要件定義書** - 法的要件を含む包括的な仕様
- 41の機能要件（FR-001〜FR-041）
- 20の非機能要件（パフォーマンス、セキュリティ等）
- 日本市場特有の法的対応要件
- ユーザーストーリーと受け入れ基準

### 🏗️ `.tmp/design.md` (1,925行)  
**技術設計書** - Gemini最適化された詳細設計
- PWA + React/Node.js アーキテクチャ  
- PostGIS空間データベース設計
- RESTful API + WebSocket仕様
- セキュリティ・パフォーマンス戦略
- テスト戦略（単体・統合・E2E）

### 📝 `.tmp/tasks.md` (609行)
**実装タスクリスト** - 4段階スケーリング計画
- 47の詳細実装タスク
- 4フェーズ構成（3ヶ月開発計画）
- リソース要件とリスク管理
- 段階的スケーリング戦略

## 🔧 開発環境設定

### Claude Code設定
このプロジェクトは**Claude Code**を使用した開発が前提となっています：

#### `.claude/settings.json` (共通設定)
- プロジェクト標準の権限設定
- MCP サーバー統合（Context7, Playwright等）
- 自動ログ・通知システム
- セキュリティ制限

#### `.claude/settings.local.json` (個人設定)  
- 個人環境専用設定
- settings.jsonの権限を継承
- Git管理対象外

## 🚀 開発開始手順

### 1. リポジトリクローン
```bash
git clone https://github.com/mhcp0001/price-tracker.git
cd price-tracker
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成（無料プラン）
3. プロジェクトのダッシュボードから以下の情報を取得：
   - Project URL (`VITE_SUPABASE_URL`)
   - Anon public key (`VITE_SUPABASE_ANON_KEY`)

### 3. データベースのセットアップ

1. SupabaseダッシュボードのSQL Editorを開く
2. 以下のSQLファイルを順番に実行：
   - `supabase/schema.sql` - テーブルとインデックスの作成
   - `supabase/policies.sql` - RLSポリシーの設定
   - `supabase/functions.sql` - ストアドファンクションの作成
   - `supabase/seed.sql` - サンプルデータの投入

### 4. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、Supabaseの情報を設定：

```bash
cp .env.example .env
```

`.env`ファイルを編集：
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

### 5. 依存関係のインストールと起動

```bash
npm install
npm run dev
```

### 6. 実装フェーズ開始

#### Phase 1: 基盤構築（2-3週間）
```bash
# 新しいブランチ作成
git checkout -b feature/foundation-setup

# タスク T001-T013 実行
# - プロジェクト初期設定
# - Docker開発環境 
# - PostgreSQL/Redis設定
# - JWT認証システム
```

#### Phase 2: コア機能実装（4-5週間）
```bash
git checkout -b feature/core-features

# タスク T014-T028 実行  
# - リアルタイム価格比較
# - 買い物リスト最適化
# - WebSocket通信
# - 地理位置・地図機能
```

### 4. 開発ツール設定

#### 必要なツール
- **Node.js 18+**
- **Docker & Docker Compose**  
- **PostgreSQL 15+** (PostGIS拡張)
- **Redis 7+**
- **GitHub CLI** (PR作成用)

## 📊 プロジェクト成果物

### Pull Request
- **[PR #1](https://github.com/mhcp0001/price-tracker/pull/1)**: 包括的な仕様書作成
  - 3ファイル、2,818行の追加
  - Gemini最適化による技術改善
  - 日本市場対応の法的要件

### 開発手法
- **仕様駆動開発**: 4段階ワークフロー（要件→設計→タスク→実装）
- **Gemini AI統合**: 技術検証とベストプラクティス相談
- **段階的スケーリング**: 1K → 100K+ DAU対応

## 📚 参考資料

### 技術ドキュメント
- [Claude Code overview](https://docs.anthropic.com/en/docs/claude-code)
- [React PWA Guide](https://create-react-app.dev/docs/making-a-progressive-web-app/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Socket.io Documentation](https://socket.io/docs/)

### 日本市場関連
- [個人情報保護法](https://www.ppc.go.jp/)
- [景品表示法](https://www.caa.go.jp/policies/policy/representation/)

## 📞 Contact & Contribution

このプロジェクトは**オープンソース**として開発されています。
- **Issues**: バグ報告・機能要求
- **Pull Requests**: 実装・改善の貢献歓迎
- **Discussions**: 技術相談・アイデア共有

## 📄 License

This project is released under the **MIT License**.
