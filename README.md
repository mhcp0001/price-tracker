# Price Tracker PWA

スーパーマーケット価格追跡プログレッシブWebアプリ（PWA）の開発プロジェクトです。ユーザーの周辺エリアのスーパーで最もお得な価格を教えてくれるスマートフォン向けWebアプリを開発しています。

## 🎯 プロジェクト概要

このアプリは日本の消費者が日常の買い物でより良い価格を見つけることを支援します。コミュニティ主導の価格情報共有により、リアルタイムで正確な価格比較を提供します。

### 主要機能

1. **🛒 買い物リスト最適化**: 総合計金額が最安になる単一店舗を提案
2. **📊 リアルタイム価格比較**: 現在いる店舗での価格vs周辺店舗の比較  
3. **🤝 コミュニティ価格共有**: ユーザー投稿による最新価格情報の共有
4. **📱 PWA対応**: オフライン機能とホーム画面インストール

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

### フロントエンド
- **React 18+** with TypeScript
- **Vite** - 高速ビルドツール
- **PWA Workbox** - Service Worker管理
- **Tailwind CSS** - ユーティリティファーストCSS
- **React Query** - サーバーステート管理
- **Zustand** - クライアントステート管理
- **Mapbox GL JS** - 地図機能

### バックエンド  
- **Node.js 18+** with TypeScript
- **Express.js** - Webフレームワーク
- **Socket.io** - リアルタイム通信
- **Prisma ORM** - データベースORM
- **PostgreSQL + PostGIS** - 空間データベース
- **Redis** - キャッシング・セッション管理

### インフラ・ツール
- **Docker** - コンテナ化
- **GitHub Actions** - CI/CD
- **AWS/GCP** - クラウドホスティング

## 🚀 Gemini最適化による改善

このプロジェクトは**Gemini AI**との技術相談により大幅に最適化されました：

### アルゴリズム簡素化
- **改善前**: 複雑な組み合わせ最適化アルゴリズム  
- **改善後**: 単純な全店舗比較 `O(店舗数 × 商品数)`
- **効果**: 開発期間短縮（4日→2日）、計算負荷軽減

### PWA戦略強化  
- **Stale-While-Revalidate**: 価格データの鮮度とオフライン両立
- **Background Sync**: オフライン時の自動キュー処理
- **IndexedDB**: 包括的オフラインデータ管理

### 日本市場対応
- **個人情報保護法**: プライバシー要件準拠
- **景品表示法**: 価格情報免責表示
- **商慣習対応**: 税込価格、特売対応

## 📈 段階的スケーリング戦略

| Phase | Target DAU | Architecture |
|-------|------------|--------------|
| **A** | 1,000 | 単一構成 |
| **B** | 10,000 | Read Replica |
| **C** | 50,000 | マイクロサービス |
| **D** | 100,000+ | Kubernetes |

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

### 2. 開発環境構築
```bash
# 仕様書確認
ls .tmp/
# requirements.md, design.md, tasks.md

# Claude Code設定確認  
ls .claude/
# CLAUDE.md, settings.json, settings.local.json
```

### 3. 実装フェーズ開始

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
