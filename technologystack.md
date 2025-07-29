# 技術スタック

## フレームワーク・ライブラリ

- **Next.js**: 14.x (React フレームワーク)
- **React**: 18.x (UI ライブラリ)
- **TypeScript**: 5.x (型安全な JavaScript)
- **Material-UI (MUI)**: 5.x (UI コンポーネントライブラリ)
- **Tailwind CSS**: 3.x (ユーティリティファースト CSS)

## 開発ツール

- **Vitest**: 1.x (テストフレームワーク)
- **ESLint**: 8.x (コード品質チェック)
- **PostCSS**: 8.x (CSS プロセッサー)
- **ImageMagick**: 7.1.2 (画像変換ツール)

## 機能ライブラリ

- **jsPDF**: PDF エクスポート機能
- **SheetJS**: Excel ファイル読み込み
- **React DnD**: ドラッグ&ドロップ機能

## 画像・アセット

- **タイトル画像**: `/public/minikuro-title.jpg` (ミニクロロゴ)
- **ファビコン**: `/src/app/favicon.ico` (favicon.jpg から変換 - 16x16, 32x32, 48x48 サイズ、適切な正方形サイズに調整)
- **OGP 画像**: `/public/og-image.jpg` (minikuro-title.jpg から変換 - 1200x630 サイズ、適切な余白確保)
- **アイコン**: Material-UI アイコンセット

## SEO・ソーシャルメディア対応

- **Open Graph Protocol**: ソーシャルメディアでの表示最適化
- **Twitter Cards**: Twitter での表示最適化
- **メタデータ**: 適切なタイトル、説明文、画像の設定
- **metadataBase**: 本番環境での OGP 画像 URL 設定
- **キャッシュ最適化**: 画像ファイルの長期キャッシュ設定（1 年）
- **画像品質最適化**: 95%品質での JPEG 最適化

## ブラウザ対応

- モダンブラウザ (Chrome, Firefox, Safari, Edge)
- レスポンシブデザイン対応
