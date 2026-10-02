# 技術スタック

最終更新: 2026-10-02

## ランタイム

| 技術 | バージョン | 用途 |
| --- | --- | --- |
| Next.js | 16.3.8 (App Router) | React フレームワーク |
| React | 19.2.8 | UI |
| TypeScript | 5.9.x | 型安全 |
| Material-UI (MUI) | 7.x | UI コンポーネント |
| MUI Next.js integration | 7.3.10 | App RouterのCSSをheadへ集約し、初期描画の一致を維持 |
| Emotion | 11.x | MUI のスタイリング基盤 |

> Tailwind CSS は使用していません（過去に導入痕跡がありましたが削除済み）。スタイルは MUI の `sx` / テーマに統一しています。

## 機能ライブラリ

| 技術 | 用途 | 読み込み |
| --- | --- | --- |
| d3-scale | 年 → ピクセルのスケール変換 | 静的 |
| xlsx (SheetJS 公式CDN 0.20.3) | Excel (.xlsx) 解析 | Worker 内で動的 `import()` |
| html2canvas | 年表のキャンバス化 | 動的 `import()` |
| jsPDF | A4 横向き PDF 生成 | 動的 `import()` |

### 既知の依存関係注意点

- **xlsx**: 公式配布を使用。10MB、先頭5シート、合計5,000件、使用行20,000行、1件2,000文字・合計250,000文字、年幅2,000年で入力を制限し、Workerを30秒で中止します。
- **PDF**: クライアント側のみ。DOM・CSSを固定した専用文書からPNGで最大200ページを生成します。
- **監査**: Next.js / Vitestと間接依存を修正リリースへ更新。2026-10-02時点の `npm audit` 検出は0件。

## 開発ツール

| 技術 | バージョン | 用途 |
| --- | --- | --- |
| Vitest | 4.1.11 | ユニット / コンポーネントテスト |
| Playwright | 1.62.1 | 実ブラウザ / PDF描画の回帰テスト |
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
