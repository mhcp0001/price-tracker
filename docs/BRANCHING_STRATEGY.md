# Git Branching Strategy

Price Tracker PWAプロジェクトのブランチ戦略を定義します。

## 🌳 ブランチ構造

### メインブランチ

#### `main` (Protected)
- **用途**: 本番環境デプロイ用
- **保護**: 直接push禁止、PR必須
- **マージ元**: `develop` ブランチのみ
- **デプロイ**: 本番環境への自動デプロイ
- **リリース**: タグ付けによるバージョン管理

#### `develop` (Protected)
- **用途**: 開発統合ブランチ
- **保護**: 直接push禁止、PR必須  
- **マージ元**: `feature/*`, `hotfix/*` ブランチ
- **デプロイ**: ステージング環境への自動デプロイ
- **テスト**: 統合テスト実行

### 開発ブランチ

#### `feature/*`
- **命名規則**: `feature/[task-id]-[description]`
- **例**: `feature/T001-project-setup`, `feature/T019-price-comparison`
- **用途**: 新機能開発
- **派生元**: `develop`
- **マージ先**: `develop`
- **ライフサイクル**: 機能完了後削除

#### `hotfix/*`
- **命名規則**: `hotfix/[issue-id]-[description]`
- **例**: `hotfix/001-security-vulnerability`
- **用途**: 緊急修正
- **派生元**: `main`
- **マージ先**: `main` および `develop`
- **ライフサイクル**: 修正完了後削除

#### `release/*`
- **命名規則**: `release/[version]`
- **例**: `release/v1.0.0`, `release/v1.1.0`
- **用途**: リリース準備（バグ修正、ドキュメント更新）
- **派生元**: `develop`
- **マージ先**: `main` および `develop`
- **ライフサイクル**: リリース完了後削除

## 📋 開発フロー

### 1. 新機能開発

```bash
# developから最新を取得
git checkout develop
git pull origin develop

# feature ブランチ作成
git checkout -b feature/T014-store-management

# 開発作業
# ... コード変更 ...

# コミット
git add .
git commit -m "feat: implement store management API

- Add nearby stores search endpoint
- Implement store details retrieval
- Add store rating functionality

Implements: T014
🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# プッシュ
git push -u origin feature/T014-store-management

# PR作成（developへ）
gh pr create --base develop --title "feat: Store management API" --body "..."
```

### 2. リリース準備

```bash
# developから最新を取得
git checkout develop
git pull origin develop

# release ブランチ作成
git checkout -b release/v1.0.0

# バージョン更新、ドキュメント修正
# ... 変更作業 ...

# コミット・プッシュ
git add .
git commit -m "chore: prepare v1.0.0 release"
git push -u origin release/v1.0.0

# mainへのPR作成
gh pr create --base main --title "Release v1.0.0" --body "..."

# マージ後、developにもマージ
git checkout develop
git merge release/v1.0.0
git push origin develop

# タグ作成
git checkout main
git pull origin main
git tag v1.0.0
git push origin v1.0.0
```

### 3. 緊急修正

```bash
# mainから最新を取得
git checkout main
git pull origin main

# hotfix ブランチ作成
git checkout -b hotfix/001-security-fix

# 修正作業
# ... コード変更 ...

# コミット・プッシュ
git add .
git commit -m "fix: security vulnerability in auth middleware"
git push -u origin hotfix/001-security-fix

# mainへのPR作成
gh pr create --base main --title "hotfix: Security vulnerability fix" --body "..."

# developにもマージ
git checkout develop
git merge hotfix/001-security-fix
git push origin develop
```

## 🛡️ ブランチ保護ルール

### main ブランチ
- ✅ **直接プッシュ禁止**
- ✅ **PR必須**
- ✅ **レビュー必須** (最低1名)
- ✅ **ステータスチェック必須**
  - CI/CDパイプライン成功
  - 全テスト通過
  - セキュリティスキャン通過
- ✅ **マージ前の最新化必須**
- ✅ **管理者による強制プッシュ禁止**

### develop ブランチ
- ✅ **直接プッシュ禁止**
- ✅ **PR必須**
- ✅ **ステータスチェック必須**
  - CI/CDパイプライン成功
  - 単体テスト通過
- ✅ **マージ前の最新化必須**

## 📝 コミットメッセージ規約

### フォーマット
```
<type>: <description>

[optional body]

[optional footer]
```

### Type 一覧
- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメント変更
- **style**: コードフォーマット変更
- **refactor**: リファクタリング
- **test**: テスト追加・修正
- **chore**: その他のメンテナンス

### 例
```
feat: add shopping list optimization API

- Implement O(stores × products) optimization algorithm
- Add store availability checking
- Include distance-based sorting

Implements: T025
Closes: #15

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 🔄 自動化

### GitHub Actions ワークフロー

#### PR作成時
- **Lint & Format**: ESLint, Prettier実行
- **Test**: 単体テスト、統合テスト実行
- **Build**: アプリケーションビルド確認
- **Security**: 依存関係脆弱性スキャン

#### main ブランチマージ時
- **Deploy**: 本番環境デプロイ
- **Tag**: 自動バージョンタグ作成
- **Release**: GitHub Release作成

#### develop ブランチマージ時
- **Deploy**: ステージング環境デプロイ
- **Integration Test**: E2Eテスト実行

## 🏷️ タグ・リリース戦略

### バージョニング (Semantic Versioning)
- **Major**: 破壊的変更 (例: v2.0.0)
- **Minor**: 機能追加 (例: v1.1.0)
- **Patch**: バグ修正 (例: v1.0.1)

### タグ例
- `v1.0.0` - 初回リリース
- `v1.1.0` - 買い物リスト最適化機能追加
- `v1.1.1` - 価格比較のバグ修正

### リリースノート
各リリースには以下を含む：
- 新機能
- 修正されたバグ
- 破壊的変更
- アップグレードガイド

この戦略により、安全で効率的な開発プロセスを実現します。