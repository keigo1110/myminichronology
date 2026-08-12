# ミニクロ

Excel ファイルにまとめた **年 / 範囲 / 出来事** のデータを読み込み、**縦スクロール型の年表** としてブラウザ上に表示し、A4 横向き PDF へエクスポートできる Web アプリです。

## 機能

- **Excel ファイル読み込み**: `.xlsx` をドラッグ & ドロップ / ファイル選択
- **年表可視化**: 点イベントと期間イベント（縦バー）、`label` スタイルの塗りボックス
- **レーン操作**: 最大 5 シート、表示切替・並び替え
- **年代フィルタ**: 「拡大して再配置」/「位置はそのまま」の2モード
- **出来事検索**: 表示中の範囲・レーン内だけを検索してジャンプ
- **PDF エクスポート**: A4 横向き
- **年間高さ調整**: 8px〜120px
- **読み込み警告**: スキップ行・シート切り捨てなどを画面に表示

## セットアップ

### 前提条件

- Node.js 18.0.0 以上
- npm

### インストール

```bash
git clone <repository-url>
cd myminichronology
npm install
```

### 開発サーバー

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

開発者向けの詳細は [DEVELOPMENT.md](./DEVELOPMENT.md) を参照してください。

## 使い方

1. Excel（`.xlsx`、最大 10MB）をドロップ、またはヘッダーのアップロードボタンから選択
2. 必要なら年代範囲・レーン表示を調整
3. 「PDF エクスポート」でダウンロード

見本（利用者向け）: [public/template_sample.xlsx](./public/template_sample.xlsx)  
検証用: [public/template_test.xlsx](./public/template_test.xlsx)

## ビルド

```bash
npm run build
npm start
```

## テスト

```bash
npm run test:ci          # 一回実行
npm test                 # watch
npm run typecheck
npm run lint
```

## デプロイ

### Vercel

1. [Vercel](https://vercel.com) にアカウント作成
2. GitHub リポジトリを接続
3. `git push` で自動デプロイ

## データ形式

列の詳細は [docs/excel-template-columns.md](./docs/excel-template-columns.md) を参照してください。

| 列 | 内容 | 必須 |
| --- | --- | --- |
| A | 年（開始年） | ✔ |
| B | 出来事 | ✔ |
| C | いつまで（終了年） | 任意 |
| D | フォントサイズ（px） | 任意 |
| E | 色 | 任意 |
| F | 表示スタイル（`label` 等） | 任意 |

見本（利用者向け）: [public/template_sample.xlsx](./public/template_sample.xlsx)  
検証用: [public/template_test.xlsx](./public/template_test.xlsx)

## 技術スタック（概要）

- Next.js 15 / React 19 / TypeScript
- Material-UI 7
- d3-scale / xlsx / html2canvas / jsPDF
- Vitest + Testing Library

詳細は [technologystack.md](./technologystack.md)、構成は [directorystructure.md](./directorystructure.md)。

## トラブルシューティング

1. **Excel が読み込めない**  
   `.xlsx` か、必須列（年・出来事）があるか、10MB 以下かを確認してください。

2. **行が足りない / 警告が出る**  
   無効な年・空行・6 シート目以降はスキップされ、警告が表示されます。

3. **PDF が空白 / 失敗する**  
   非常に長い年表はブラウザのキャンバス制限に当たることがあります。年代範囲を絞って再試行してください。

4. **年表がずれるように見える**  
   「拡大して再配置」では、選んだ年代範囲いっぱいに年表を引き伸ばします。全体の位置関係を保ちたい場合は「位置はそのまま」を選んでください。

## 更新履歴

- v0.1.x: コードレビューに基づく品質・正しさ・ドキュメント整備
- v0.1.0: 初期リリース（Excel 読み込み、年表、PDF、年間高さ調整）
