# 技術スタック

最終更新: 2026-07-29

## ランタイム

| 技術 | バージョン | 用途 |
| --- | --- | --- |
| Next.js | 15.5.x (App Router) | React フレームワーク |
| React | 19.1.x | UI |
| TypeScript | 5.9.x | 型安全 |
| Material-UI (MUI) | 7.x | UI コンポーネント |
| Emotion | 11.x | MUI のスタイリング基盤 |

> Tailwind CSS は使用していません（過去に導入痕跡がありましたが削除済み）。スタイルは MUI の `sx` / テーマに統一しています。

## 機能ライブラリ

| 技術 | 用途 | 読み込み |
| --- | --- | --- |
| d3-scale | 年 → ピクセルのスケール変換 | 静的 |
| xlsx (SheetJS) | Excel (.xlsx) 解析 | 動的 `import()` |
| html2canvas | 年表のキャンバス化 | 動的 `import()` |
| jsPDF | A4 横向き PDF 生成 | 動的 `import()` |

### 既知の依存関係注意点

- **xlsx (npm 版)**: Prototype Pollution / ReDoS の advisory があり、npm 上に修正版はありません。入力は `.xlsx`・10MB・年範囲制限で緩和しています。将来的には SheetJS 公式配布、または `exceljs` への移行を検討してください。
- **jsPDF / DOMPurify**: 可能な範囲で最新版へ更新済み。PDF 生成はクライアント側のみです。

## 開発ツール

| 技術 | バージョン | 用途 |
| --- | --- | --- |
| Vitest | 3.x | ユニット / コンポーネントテスト |
| Testing Library | 16.x | React コンポーネントテスト |
| ESLint | 9.x (flat config) | リント |
| jsdom | 26.x | テスト環境 |

## 画像・アセット

| 用途 | パス |
| --- | --- |
| タイトル画像 | `/public/minikuro-title.jpg` |
| OGP 画像 | `/public/og-image.jpg` |
| アプリアイコン | `/src/app/icon.png`, `/src/app/apple-icon.png`（Next.js ファイルベース） |
| Excel 見本 | `/public/template_sample.xlsx` |
| Excel 検証用 | `/public/template_test.xlsx` |

## SEO・ソーシャル

- Open Graph / Twitter Cards（`src/app/layout.tsx`）
- `metadataBase`: 本番 URL
- JSON-LD (`SoftwareApplication`)

## UI 国際化（i18n）

- カスタム `LocaleProvider`（`src/i18n/`）で ja / en を切替
- `useT()` / `useLocale()` で UI 文字列を取得（`messages.ts` が正本）
- **next-intl は未使用**

## ブラウザ対応

- モダンブラウザ（Chrome / Firefox / Safari / Edge の最新2メジャー）
- レスポンシブ対応（ヘッダー・空状態・年表の横スクロール）
