# ディレクトリ構成

最終更新: 2026-07-29

├── docs/
│   ├── excel-template-columns.md   # Excel 列役割一覧（正本）
│   └── goal_design.png             # 年表 UI の見た目目標
├── .github/workflows/
│   └── ci.yml                      # typecheck / lint / test / build
├── public/                         # 静的ファイル
│   ├── minikuro-title.jpg          # ヘッダーロゴ
│   ├── og-image.jpg                # OGP 画像
│   ├── template_sample.xlsx        # 利用者向け入力見本
│   └── template_test.xlsx          # 開発・境界値検証用
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # ルートレイアウト / メタデータ / JSON-LD
│   │   ├── page.tsx                # メインページ（クライアント）
│   │   ├── providers.tsx           # ThemeProvider + LocaleProvider + ライト/ダーク
│   │   ├── robots.ts               # /robots.txt 生成
│   │   ├── sitemap.ts              # /sitemap.xml 生成
│   │   ├── globals.css             # グローバル CSS
│   │   ├── icon.png                # favicon（ファイルベース）
│   │   └── apple-icon.png          # Apple touch icon
│   ├── theme/
│   │   └── createAppTheme.ts       # 紙面トーンの light/dark テーマ
│   ├── i18n/                       # UI 日英（LocaleProvider + 辞書）
│   │   ├── messages.ts             # ja / en 文言カタログ
│   │   ├── LocaleProvider.tsx      # useT / useLocale
│   │   ├── errors.ts               # AppMessageError
│   │   └── index.ts                # translate ヘルパー
│   ├── components/
│   │   ├── Header.tsx              # ヘッダー（アップロード / フィルタ / PDF / テーマ / 言語）
│   │   ├── Timeline.tsx            # 年表ルート
│   │   ├── YearAxis.tsx            # 左右の年軸
│   │   ├── LaneHeaderRow.tsx       # レーン見出し（sticky）
│   │   ├── LaneColumn.tsx          # レーン本体（グリッド + イベント）
│   │   ├── EventItem.tsx           # 点 / 期間イベント
│   │   ├── DraggableLaneList.tsx   # レーン選択・並び替え（HTML5 DnD）
│   │   ├── CopyableAlert.tsx       # 警告/エラー + エージェント用コピー
│   │   └── ErrorBoundary.tsx       # 表示エラーのフォールバック
│   ├── hooks/
│   │   ├── useSheetLoader.ts       # Excel 読み込み状態
│   │   ├── useTimelineData.ts      # レイアウト・色・年範囲
│   │   ├── useFilteredEvents.ts    # レーン / 年フィルタ・ズーム再計算
│   │   ├── usePdfExport.ts         # PDF エクスポート状態
│   │   └── useIsomorphicLayoutEffect.ts # 描画前に同期する副作用（SSR 安全）
│   ├── lib/
│   │   ├── types.ts                # 共有型
│   │   ├── site.ts                 # 公開 URL / サイト文言（metadata・robots・sitemap 共有）
│   │   ├── fileValidation.ts       # .xlsx / サイズ / 年定数
│   │   ├── parseExcel.ts           # Excel → TimelineData + warnings
│   │   ├── parseWarnings.ts        # 警告の積み上げ
│   │   ├── computeLayout.ts        # 配置計算
│   │   ├── yearTicks.ts            # 年目盛り間隔
│   │   ├── eventDomId.ts           # イベントの DOM id
│   │   ├── agentPrompt.ts          # 警告修正プロンプト生成
│   │   ├── exportPdf.ts            # html2canvas + jsPDF
│   │   └── colorPalette.ts         # WCAG 準拠パレット / 年表配色 / レーン上の線色
│   └── tests/                      # Vitest
├── package.json
├── tsconfig.json
├── next.config.ts
├── vitest.config.ts
├── eslint.config.mjs
├── README.md                       # ユーザー向け
├── DEVELOPMENT.md                  # 開発者向け（本リポジトリの開発手順）
├── technologystack.md              # 技術スタック記録
└── directorystructure.md           # 本ファイル
```

## データフロー概要

1. ユーザーが `.xlsx` をドロップ / 選択
2. `validateExcelFile` → `parseExcel`（警告付き）
3. `useTimelineData` が全データでレイアウト・色（レーン名キー）を算出
4. `useFilteredEvents` が選択レーン・年範囲を適用
   - **zoom**: フィルタ後データで `computeLayout` を再実行（年軸も同期）
   - **filter**: 元レイアウトを維持し、表示だけ絞る
5. `Timeline` がレーン名・色・幅マップで描画（左右年軸）
   - 該当イベントが 0 件なら年表ではなく案内文（`empty.filterNoResults`）を表示
6. PDF は `#timelineRoot` をキャプチャ（`[data-timeline-scroll]` のスクロールを先頭に戻す）

## コンポーネント役割

### Header.tsx

- ロゴ、レイアウトモード、年間高さ、アップロード、PDF、テーマ、言語切替、ヘルプ
- 展開パネル: 年代範囲入力、レーン選択 / 並び替え
- エラー Alert（読み込み / ドロップ / PDF）

### Timeline.tsx

- sticky 年軸（左右） + sticky レーンヘッダー + 各 `LaneColumn`
- 見た目目標: `docs/goal_design.png`
- 色・幅は **レーン名** で参照（並び替え / 非表示でも色がずれない）

### ErrorBoundary.tsx

- レンダー例外時に再読み込み UI を表示
