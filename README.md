# ミニクロ

Excel または Google Sheets にまとめた **年 / 範囲 / 出来事** のデータを読み込み、**縦スクロール型の年表** としてブラウザ上に表示し、A4 縦 PDF へエクスポートできる Web アプリです。

## 機能

- **Excel ファイル読み込み**: .xlsx ファイルをドラッグ & ドロップで読み込み
- **Google Sheets 読み込み**: 公開 URL からデータを取得
- **年表可視化**: 点イベント（円）と期間イベント（縦バー）を表示
- **PDF エクスポート**: A4 縦サイズで複数ページに分割した PDF を生成
- **レスポンシブ対応**: 画面幅 1200px 固定で最適化

## セットアップ

### 前提条件

- Node.js 18.0.0 以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd timeline-visualizer

# 依存関係をインストール
npm install
```

### 開発サーバーの起動

```bash
# 開発サーバーを起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

### 動作確認

1. **Excel ファイルの読み込み**

   - Excel ファイル（.xlsx）をドラッグ & ドロップ
   - またはファイル選択ボタンをクリックしてファイルを選択

2. **Google Sheets の読み込み**

   - Google Sheets の公開 URL を入力
   - 「読み込み」ボタンをクリック

3. **PDF エクスポート**
   - データを読み込んだ後、「PDF エクスポート」ボタンをクリック
   - A4 縦サイズの PDF がダウンロードされます

## ビルド

```bash
# 本番用ビルド
npm run build

# 本番サーバーを起動
npm start
```

## テスト

```bash
# テストを実行
npm test

# テストカバレッジを確認
npm run test:coverage

# テスト UI を起動
npm run test:ui
```

## デプロイ

### Vercel へのデプロイ

1. [Vercel](https://vercel.com) にアカウントを作成
2. GitHub リポジトリを接続
3. `git push` で自動デプロイ

### 手動デプロイ

```bash
# ビルド
npm run build

# デプロイ（Vercel CLI を使用）
vercel --prod
```

## データ形式

### Excel ファイル形式

| 列  | 内容               | 必須 |
| --- | ------------------ | ---- |
| A   | 年（開始年）       | ✔    |
| B   | いつまで（終了年） | 〃   |
| C   | 出来事             | ✔    |

### Google Sheets 形式

同じ列構成で、公開 URL を指定して読み込みます。

## 技術スタック

- **フレームワーク**: Next.js 14
- **UI**: Material-UI (MUI)
- **可視化**: d3-scale
- **ファイル解析**: xlsx, papaparse
- **PDF 生成**: html2canvas, jsPDF
- **テスト**: Vitest, React Testing Library
- **言語**: TypeScript

## ライセンス

MIT License

## 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## トラブルシューティング

### よくある問題

1. **Excel ファイルが読み込めない**

   - ファイル形式が .xlsx であることを確認
   - 必須列（年、出来事）が存在することを確認

2. **PDF エクスポートが失敗する**

   - ブラウザのポップアップブロッカーを無効化
   - 十分なメモリがあることを確認

3. **Google Sheets が読み込めない**
   - スプレッドシートが公開設定になっていることを確認
   - URL が正しい形式であることを確認

## 更新履歴

- v0.1.0: 初期リリース
  - Excel ファイル読み込み
  - Google Sheets 読み込み
  - 年表可視化
  - PDF エクスポート
