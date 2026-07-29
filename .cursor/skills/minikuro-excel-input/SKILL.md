---
name: minikuro-excel-input
description: >-
  Creates and validates Excel (.xlsx) input files for ミニクロ (myminichronology)
  chronology timelines. Use when the user asks to make a chronology Excel,
  年表入力ファイル, template_sample.xlsx, template_test.xlsx, lane sheets,
  label/期間 events, or convert notes/CSV/lists into a minikuro-compatible workbook.
---

# ミニクロ Excel 入力ファイル作成

## いつ使うか

ユーザーが年表用の `.xlsx` を新規作成・編集・検証したいとき。アプリ本体のコード変更ではなく、**入力データ作成**が目的。

## 列契約（必須）

| 列 | 内容 | 必須 |
| --- | --- | --- |
| A | 年（開始年） | ✔ |
| B | 出来事 | ✔ |
| C | いつまで（終了年） | 任意（空＝点） |
| D | フォントサイズ px（8〜48） | 任意 |
| E | 色 `#RRGGBB` | 任意（省略時黒） |
| F | 表示スタイル | 任意 |
| G | 画像リンク（http/https URL） | 任意 |

詳細の正本: `docs/excel-template-columns.md`

| ファイル | 用途 |
| --- | --- |
| `public/template_sample.xlsx` | 利用者向け見本（警告なし） |
| `public/template_test.xlsx` | 開発・目視検証（境界値・無効 F 列など） |

### F列の値

| 値 | 表示 |
| --- | --- |
| 空欄 / `default` / `テキスト` | 通常テキスト。期間ありなら細い期間バー |
| `label` / `ラベル` | 塗りボックス＋縦書き。**サイズは文字数**（C列の期間は見た目に使わない） |
| それ以外（例: `box`） | **無効** → 警告を出して通常表示として扱う |

### E列の意味

- 通常表示 → **文字色**
- `label` → **ボックスの塗り色**（文字色は自動）

### G列（画像）

- `https://...` / `http://...` のみ。固定サムネ枠で埋め込み
- PDF では CORS 許可が必要
- 無効 URL は警告のうえ画像なし

## ワークフロー

1. ユーザー意図を整理する（レーン＝シート、点/期間、label の要否）
2. シート名＝レーン名（最大 5）。1行目ヘッダー固定
3. 行データを組み立てる（年は 1〜9999、全体スパン ≤2000 年）
4. `.xlsx` を生成する（下記スクリプト推奨）
5. 生成物のパスを伝え、アプリへ DnD するよう案内する

### ヘッダー行（必ずこれ）

```
年, 出来事, (いつまで), フォントサイズ, 色, 表示スタイル, 画像リンク
```

## 生成スクリプト

リポジトリルートで:

```bash
node .cursor/skills/minikuro-excel-input/scripts/generate-xlsx.mjs \
  --out path/to/chronology.xlsx \
  --input path/to/data.json
```

またはパイプ:

```bash
node .cursor/skills/minikuro-excel-input/scripts/generate-xlsx.mjs --out chronology.xlsx <<'EOF'
{
  "sheets": [
    {
      "name": "政治",
      "rows": [
        { "start": 1960, "label": "高度成長", "end": 1973, "style": "label", "color": "#1565C0", "fontSize": 13 },
        { "start": 1989, "label": "平成", "imageUrl": "https://placehold.co/96x72/png" }
      ]
    }
  ]
}
EOF
```

JSON スキーマは [schema.md](schema.md) を参照。

依存: プロジェクトの `xlsx`（`npm install` 済み想定）。未インストールならリポジトリで `npm install` してから実行。

## デザイン指針（配置が綺麗になる書き方）

- **期間の長さを見せたい** → F空欄＋C列に終了年（期間バー）
- **時代名・カテゴリ見出し** → F=`label`、短めの文言（長いと縦に伸びる）
- **同じ年に多数** → 文言を短く。レーンを分ける
- **大きな文字** → D列。点イベントでも高さが確保される
- 無効値（`box` 等）は入れない（警告の原因になる）

## 検証チェックリスト

- [ ] 各シート1行目が上記ヘッダー
- [ ] A・B が全データ行で埋まっている
- [ ] C は空または A 以上の年
- [ ] D は空または 8〜48
- [ ] E は空または `#RRGGBB` / `RRGGBB` / `rgb()`
- [ ] F は空 / `label` / `ラベル` / `default` / `テキスト` のみ
- [ ] G は空または http(s) URL
- [ ] シート数 ≤ 5
- [ ] ファイル全体の年幅 ≤ 2000

## アプリからの貼り付けプロンプト

アプリの警告・エラー欄のコピーボタンで、Skill「minikuro-excel-input」向けの依頼文がクリップボードに入ります。  
ユーザーがそれを貼り付けたら、記載の問題を優先して入力ファイル／テンプレートを修正してください。

黄色い警告は**読み込みは成功しているが、一部行を補正・スキップした**通知。

例: `表示スタイル「box」は未対応のため通常表示にします`  
→ F列が未対応の値。その行は通常表示で描画される。入力を直すか空欄/`label` にする。

境界値・警告の確認には `public/template_test.xlsx`（シート `5_境界値` など）を使う。  
利用者向けファイルや `template_sample.xlsx` には無効な F 列値を入れない。

## テンプレート再生成

列仕様やテンプレート内容を更新したら:

```bash
node .cursor/skills/minikuro-excel-input/scripts/regenerate-templates.mjs
```

## 追加リソース

- 列仕様: [docs/excel-template-columns.md](../../../docs/excel-template-columns.md)
- JSON 形式: [schema.md](schema.md)
