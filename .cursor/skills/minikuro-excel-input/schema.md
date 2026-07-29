# generate-xlsx.mjs 入力 JSON

```json
{
  "sheets": [
    {
      "name": "レーン名（シート名）",
      "rows": [
        {
          "start": 1960,
          "label": "出来事テキスト",
          "end": 1973,
          "fontSize": 13,
          "color": "#1565C0",
          "style": "label"
        }
      ]
    }
  ]
}
```

| フィールド | 必須 | 説明 |
| --- | --- | --- |
| `sheets[].name` | ✔ | レーン名（最大5シート） |
| `rows[].start` | ✔ | 開始年 |
| `rows[].label` | ✔ | 出来事 |
| `rows[].end` | | 終了年（省略＝点） |
| `rows[].fontSize` | | 8〜48 |
| `rows[].color` | | `#RRGGBB` など |
| `rows[].style` | | `label` / `ラベル` / 空 / `default` / `テキスト` |
