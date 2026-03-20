# FROMDEX

ゲーム情報Wiki。
情報を収集・整理するためのプラットフォームです。

https://fromdex.com

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | Vite + React + TypeScript + TailwindCSS v4 |
| バックエンド | Spring Boot 3.2.5 (Java 21) + Spring Security + JWT |
| データベース | PostgreSQL |
| 本番インフラ | Docker Compose on さくらの VPS (Rocky Linux 8) |

---

## ローカル環境構築

### 前提条件

- Java 21
- Maven 3.x
- Node.js 20+
- PostgreSQL 15+

### データベース作成

```bash
psql -U postgres -c "CREATE DATABASE gamewiki;"
psql -U postgres -d gamewiki -f db/init.sql

過去のDB更新履歴をSQLファイルとして残しているが、現状はinit.sqlで一括作成可能
```

### バックエンド設定ファイル作成

`backend/src/main/resources/application-local.properties` を作成（git 管理外）:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/gamewiki
spring.datasource.username=postgres
spring.datasource.password=admin

jwt.secret=your-secret-key-here

anthropic.api.key=your-anthropic-api-key-here
```

---

## 起動コマンド

### バックエンド

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
# http://localhost:8080
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

### データベース接続

```bash
psql -U postgres -d gamewiki
```

---

## ブランチ

| ブランチ | 用途 |
|---|---|
| `main` | main branch|
| `develop` | 開発作業 |
| `release` | デプロイトリガー（GitHub Actions） |

開発フロー: `develop` で開発 → PR → `release`にマージ -> GitHub Actionsデプロイトリガー

---

## 本番デプロイ

詳細は [DEPLOYMENT.md](DEPLOYMENT.md) を参照。

```bash
# VPS 上での更新
git pull origin release
docker compose up -d --build
```

---

## 実装済み機能

### コンテンツ管理
- ゲーム一覧・詳細・CRUD（画像付き、ドラッグ並び替え）
- アイテム一覧・詳細・CRUD（画像付き、タグ・ゲーム紐付け）
- ボス一覧・詳細・CRUD（画像付き、タグ・ゲーム紐付け、ドロップアイテム）
- NPC 一覧・詳細・CRUD（画像付き、タグ・ゲーム紐付け、ドロップアイテム）
- セリフ・考察テキスト（ラベル付き複数エントリ）

### タグ・フィルター
- タグ管理（ITEM / BOSS / NPC タイプ別、ゲームごと、管理者のみ）
- ゲーム・タグ・キーワードによる絞り込み（リアルタイム反映）
- ボス/NPC タグ名をキーワードとした関連アイテム自動表示

### コミュニケーション
- アイテムへのコメント・考察投稿（投稿・編集・削除・いいね・返信）
- 掲示板
- 啓蒙ポイント（編集・投稿への貢献でポイント付与）
- 編集承認フロー（管理者が差分確認・承認）
- 通報機能

### UI・UX
- 黒赤アンバー基調のダークテーマ
- レスポンシブレイアウト（モバイル対応）
- アイテム・ボス・NPC カードのホバープレビュー
- BGM・効果音システム
- 相関図

### AI 連携
- 画像選択時に Anthropic API でテキスト自動抽出 → 説明欄入力

### 管理者機能
- 編集承認・差分確認
- 通報管理
- ユーザー管理・ロール変更
- タグ管理

---

## 実装予定

- 編纂記録（編集履歴の全件表示）
- タグクリックでそのタグのアイテム一覧へ遷移
- ゲーム詳細ページの Wikipedia / 公式 / YouTube リンク
- 画像透過処理
- AI による自動相関図作成、説明文以外の情報の自動入力
- 仮考察案（テキスト + 自由入力から考察の叩き台生成）
- 関連ニュースの表示内容、UI変更
- 投稿ポイントによる報酬追加
- サイト内登録データ拡充
- 簡易ゲーム機能（チュートリアル再現？）