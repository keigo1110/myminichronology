# ディレクトリ構成

```timeline-visualizer/
├── public/                          # 静的ファイル
│   ├── minikuro-title.jpg          # ミニクロタイトル画像
│   ├── favicon.ico                 # ファビコン
│   └── *.svg                       # その他のアイコン
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx             # ルートレイアウト
│   │   ├── page.tsx               # メインページ
│   │   ├── providers.tsx          # プロバイダー設定
│   │   ├── globals.css            # グローバルスタイル
│   │   └── favicon.ico            # ファビコン
│   ├── components/                 # React コンポーネント
│   │   ├── Header.tsx             # ヘッダーコンポーネント（タイトル画像表示）
│   │   ├── Timeline.tsx           # タイムライン表示
│   │   ├── Controls.tsx           # コントロールパネル
│   │   ├── DraggableLaneList.tsx  # ドラッグ可能なレーンリスト
│   │   ├── EventItem.tsx          # イベントアイテム
│   │   ├── LaneColumn.tsx         # レーンカラム
│   │   ├── LaneHeaderRow.tsx      # レーンヘッダー行
│   │   ├── PdfExport.tsx          # PDF エクスポート
│   │   └── SearchFilter.tsx       # 検索フィルター
│   ├── hooks/                      # カスタムフック
│   │   ├── useTimelineData.ts     # タイムラインデータ管理
│   │   ├── useFilteredEvents.ts   # イベントフィルタリング
│   │   ├── usePdfExport.ts        # PDF エクスポート
│   │   └── useSheetLoader.ts      # シート読み込み
│   ├── lib/                        # ユーティリティ関数
│   │   ├── types.ts               # 型定義
│   │   ├── parseExcel.ts          # Excel パーサー
│   │   ├── fetchGSheet.ts         # Google Sheets 取得
│   │   ├── computeLayout.ts       # レイアウト計算
│   │   └── exportPdf.ts           # PDF エクスポート
│   └── tests/                      # テストファイル
│       ├── setup.ts               # テスト設定
│       ├── Header.test.tsx        # ヘッダーテスト
│       ├── DraggableLaneList.test.tsx # レーンリストテスト
│       ├── parseExcel.test.ts     # Excel パーサーテスト
│       ├── computeLayout.test.ts  # レイアウト計算テスト
│       ├── useFilteredEvents.test.ts # フィルターテスト
│       └── SearchFilter.test.tsx  # 検索フィルターテスト
├── package.json                    # 依存関係管理
├── tsconfig.json                   # TypeScript 設定
├── next.config.ts                  # Next.js 設定
├── vitest.config.ts                # Vitest 設定
├── eslint.config.mjs               # ESLint 設定
├── postcss.config.mjs              # PostCSS 設定
├── README.md                       # プロジェクト説明
├── memo.md                         # メモ
├── title.jpg                       # 元のタイトル画像
├── technologystack.md              # 技術スタック記録
└── directorystructure.md           # ディレクトリ構成記録
```

## 主要コンポーネントの役割

### Header.tsx

- アプリケーションのヘッダー部分
- ミニクロタイトル画像の表示
- ファイルアップロード機能
- PDF エクスポート機能
- 年間高さ調整機能
- レーン選択・並び替え機能

### Timeline.tsx

- メインのタイムライン表示
- イベントの可視化
- 年軸の表示

### DraggableLaneList.tsx

- ドラッグ&ドロップ可能なレーンリスト
- レーンの選択・非選択切り替え
- レーンの順序変更

## 画像ファイルの配置

- **タイトル画像**: `public/minikuro-title.jpg`
- **ファビコン**: `public/favicon.ico` (ミニクロロゴ)
- **元画像**: `title.jpg` (ルートディレクトリ)
- **表示位置**: ヘッダーコンポーネントの左上
