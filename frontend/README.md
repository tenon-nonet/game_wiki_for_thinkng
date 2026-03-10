# Game Wiki — Frontend

React + TypeScript + Vite + TailwindCSS v4 で構築されたフロントエンドです。

## 技術スタック

| | ライブラリ | 役割 |
|---|---|---|
| UI | React 19 | コンポーネントベースの UI 構築 |
| 言語 | TypeScript | 型安全な開発・IDE 補完 |
| ビルド | Vite | 高速な開発サーバー・バンドラー |
| スタイル | TailwindCSS v4 | ユーティリティファーストな CSS |
| ルーティング | React Router v6 | SPA ページ遷移 |
| HTTP | Axios | バックエンド API との通信 |
| ファイル | JSZip | 画像 ZIP の一括取り込み |

## 起動

```bash
npm install
npm run dev
# http://localhost:5173
```

## ディレクトリ構成

```
src/
├── api.ts          # バックエンド API 呼び出し一覧
├── auth.ts         # JWT 認証ヘルパー（isLoggedIn, isAdmin）
├── types.ts        # 共通型定義（Game, Item, Boss, Npc, Tag, Comment）
├── App.tsx         # ルーティング定義
├── components/
│   └── Navbar.tsx  # ナビゲーションバー
└── pages/
    ├── HomePage.tsx          # トップ（ゲーム一覧）
    ├── GameDetailPage.tsx    # ゲーム詳細
    ├── ItemsPage.tsx         # アイテム一覧
    ├── ItemDetailPage.tsx    # アイテム詳細・コメント
    ├── ItemFormPage.tsx      # アイテム追加・編集
    ├── BulkImportPage.tsx    # ZIP 画像一括取り込み
    ├── BossesPage.tsx        # ボス一覧
    ├── BossDetailPage.tsx    # ボス詳細・関連アイテム
    ├── BossFormPage.tsx      # ボス追加・編集
    ├── NpcsPage.tsx          # NPC 一覧
    ├── NpcDetailPage.tsx     # NPC 詳細・関連アイテム
    ├── NpcFormPage.tsx       # NPC 追加・編集
    ├── TagsAdminPage.tsx     # タグ管理（管理者）
    └── LoginPage.tsx         # ログイン
```

## 環境変数・プロキシ

`vite.config.ts` で `/api` と `/uploads` を `http://localhost:8080` にプロキシしています。
バックエンドが起動していない場合は API エラーになります。
