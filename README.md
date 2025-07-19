# 🍽️ ランチマップ

東京都内のランチスポットを地図で検索・表示するWebアプリケーション

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/lunch-map)

## ✨ 主要機能

- 🗺️ **インタラクティブな地図表示** - Leaflet + OpenStreetMap
- 🔍 **高度な検索・絞り込み** - 料理ジャンル、価格帯、営業状況、混雑状況
- 🏪 **詳細な店舗情報** - 営業時間、連絡先、アクセス情報
- 📱 **レスポンシブデザイン** - モバイル・デスクトップ対応
- ⚡ **高速なSSR** - React Router v7による最適化
- 🔜 **Coming Soon機能** - 東京以外の地域対応予告

## 🛠️ 技術スタック

- **フロントエンド**: React Router v7 (SSR)
- **地図**: Leaflet + OpenStreetMap
- **データベース**: Turso Cloud (SQLite)
- **スタイリング**: Tailwind CSS
- **デプロイ**: Vercel
- **型安全性**: TypeScript

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成し、以下を設定:

```env
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:5173` で利用できます。

## 📦 プロダクションビルド

```bash
npm run build
```

## 🌐 デプロイ手順

### 1. Turso Cloudデータベースの作成

1. [Turso](https://turso.tech/)にアカウント作成
2. データベースを作成:
   ```bash
   turso db create lunch-map-db
   ```
3. 認証トークンを取得:
   ```bash
   turso db tokens create lunch-map-db
   ```

### 2. GitHubリポジトリの作成

```bash
# GitHubでリポジトリを作成後
git remote add origin https://github.com/YOUR_USERNAME/lunch-map.git
git push -u origin main
```

### 3. Vercelでのデプロイ

1. [Vercel](https://vercel.com/)にGitHubアカウントでログイン
2. 「New Project」からGitHubリポジトリを選択
3. 環境変数を設定:
   - `TURSO_DATABASE_URL`: Tursoデータベース URL
   - `TURSO_AUTH_TOKEN`: Turso認証トークン
4. 「Deploy」ボタンでデプロイ開始

### 4. Docker Deployment (Optional)

```bash
docker build -t lunch-map .
docker run -p 3000:3000 lunch-map
```

## 📁 プロジェクト構造

```
app/
├── components/          # 再利用可能なコンポーネント
│   ├── Map.tsx         # 地図表示ラッパー
│   └── MapClient.tsx   # 実際の地図コンポーネント
├── lib/
│   └── db.server.ts    # データベース操作関数
├── routes/             # ページルート
│   ├── home.tsx        # ホームページ
│   ├── map.tsx         # 地図ページ
│   ├── restaurant.tsx  # 店舗詳細ページ
│   └── coming-soon.tsx # Coming Soonページ
├── types/
│   └── restaurant.ts   # 型定義
└── routes.ts           # ルート設定
```

## 🤝 貢献

プルリクエストや Issue の投稿を歓迎します！

## 📄 ライセンス

MIT License

---

🤖 Generated with [Claude Code](https://claude.ai/code)
