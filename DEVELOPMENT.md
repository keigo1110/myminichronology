# 開発者向けドキュメント

ミニクロ（myminichronology）の開発・保守ガイドです。ユーザー向けの使い方は [README.md](./README.md) を参照してください。

## 前提

- Node.js 18 以上（20 LTS 推奨）
- npm

## セットアップ

```bash
git clone <repository-url>
cd myminichronology
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) で起動します。

## npm スクリプト

| コマンド | 説明 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド |
| `npm start` | 本番サーバー |
| `npm run lint` | ESLint（flat config） |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest（watch） |
| `npm run test:run` / `test:ci` | Vitest 一回実行（CI 向け） |
| `npm run test:coverage` | カバレッジ（`@vitest/coverage-v8` が必要なら別途導入） |

品質確認の推奨順:

```bash
npm run typecheck && npm run lint && npm run test:ci && npm run build
```

## アーキテクチャ

### 関心の分離

| 層 | 役割 |
| --- | --- |
| `src/app/page.tsx` | 画面状態の組み立て、DnD、警告表示 |
| `src/hooks/*` | データ読み込み・レイアウト・フィルタ・PDF 状態 |
| `src/lib/*` | 純関数（パース、配置、検証、PDF） |
| `src/components/*` | 表示専用に近い UI |

### 年軸の単一ソース

フィルタ（zoom モード）時は `useFilteredEvents` が返す `yearRange` を `Timeline` に渡します。  
イベント座標と年ラベル／グリッドが同じ範囲を共有しないと、見た目上ずれます。

### レーン識別子

色・幅は **配列インデックスではなくレーン名**（`laneColorByName` / `laneWidthByName`）で引きます。並び替えや非表示で色が入れ替わらないようにするためです。

### Excel パース契約

`parseExcel(file)` は `ParseResult` を返します。

```ts
{
  lanes: TimelineData;
  warnings: ParseWarning[];  // 行スキップ・シート切り捨て等
  truncatedSheets: number;
}
```

致命的エラー（有効データなし、年幅超過など）のみ `throw` します。部分的な不正行は警告として UI に出します。

### 制約（意図的）

| 項目 | 値 | 理由 |
| --- | --- | --- |
| ファイル形式 | `.xlsx` のみ | パーサ対象を限定 |
| ファイルサイズ | ≤ 10MB | メインスレッド負荷 |
| シート数 | 先頭 5 件 | UI / 幅の上限 |
| 年 | 1〜9999 | 異常値でタブフリーズ防止 |
| 年幅 | ≤ 2000 年 | 密度マップ・DOM 数の上限 |

定数は `src/lib/fileValidation.ts` に集約しています。

## Excel 入力仕様

| 列 | 内容 | 必須 |
| --- | --- | --- |
| A | 開始年 | ✔ |
| B | 終了年 | 任意（空なら点イベント） |
| C | 出来事 | ✔ |
| D | フォントサイズ（px, 8〜48） | 任意 |
| E | 色（`#RRGGBB` / `#RGB`） | 任意（空なら `#000000`） |

- 1 行目はヘッダーとしてスキップ
- シート名 = レーン名
- 日付セルは年に変換を試みます
- テンプレート: [`/public/template.xlsx`](./public/template.xlsx)
- 文字色は塗り色とのコントラストから自動選択（白 or 濃色）

## テスト方針

- **純関数**（`parseExcel`, `computeLayout`, `fileValidation`, `yearTicks`）を厚めにカバー
- コンポーネントは Header / DraggableLaneList を中心に
- ファイルドロップ検証は `validateExcelFile` を共有してテスト（実装とテストの二重実装を避ける）

新しいパース仕様を足すときは、まず `src/tests/parseExcel.test.ts` にケースを追加してください。

## PDF エクスポート

- 対象: `#timelineRoot`
- `html2canvas` の scale はキャンバス上限に合わせて自動調整
- ページ分割時は一時キャンバスを再利用、JPEG 0.92 で出力

巨大年表ではブラウザのキャンバス制限により品質が落ちることがあります。

## セキュリティ / 依存関係メモ

- ユーザー任意のバイナリをクライアントでパースするため、年・サイズ制限は必須です
- `xlsx` npm パッケージには未修正 advisory があります（`technologystack.md` 参照）
- 外部リンクは `rel="noopener noreferrer"` 付きの `<a>` を使用

## UI 変更時の注意

このリポジトリの運用ルール上、**レイアウト・色・フォント・間隔などの UI/UX 変更は事前承認が必要**です。  
バグ修正・アクセシビリティ（`aria-*` / キーボード）・文言の正確化は例外的に許容されますが、見た目を大きく変えない範囲で行ってください。

## ドキュメントの置き場所

| ファイル | 対象読者 |
| --- | --- |
| `README.md` | 利用者・導入者 |
| `DEVELOPMENT.md` | コントリビュータ（本ファイル） |
| `technologystack.md` | 技術選定の記録 |
| `directorystructure.md` | ディレクトリ地図 |
| `docs/goal_design.png` | 年表 UI の見た目目標 |

バージョンや構成を変えたら、上記ファイル（stack / structure / 本ファイル）を同じ PR で更新してください。

## UI デザイン方針

年表の見た目目標は [`docs/goal_design.png`](./docs/goal_design.png) です。

意識している点:

- 左右の年軸
- レーンごとの淡い背景色
- イベントは塗りつぶしブロック（点イベントも枠付き円ではなく色面）
- 長い期間イベントは縦書き
- 密集した情報量・紙面的なトーン（角丸・影は控えめ）

機能追加時も、このトーンから外れる UI 変更は事前に方針を確認してください。

## 今後の推奨バックログ（未実装）

新規機能に入る前に検討するとよい項目です。

1. Excel パースの Web Worker 化（UI フリーズ耐性）
2. 年表の仮想スクロール（超長スパン）
3. `xlsx` → メンテ中ライブラリへの移行
4. イベント詳細パネル（現状クリックは未配線）
5. goal_design へのさらなる寄せ（列内テキスト密度・年ごとの行揃えなど）