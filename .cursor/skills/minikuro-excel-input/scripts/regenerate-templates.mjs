#!/usr/bin/env node
/**
 * public/template_sample.xlsx と public/template_test.xlsx を再生成する。
 * Usage (repo root): node .cursor/skills/minikuro-excel-input/scripts/regenerate-templates.mjs
 */
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../../..');
const XLSX = require(path.join(root, 'node_modules/xlsx'));

const HEADER = ['年', '出来事', '(いつまで)', 'フォントサイズ', '色', '表示スタイル', '画像リンク'];

/** CORS しやすいプレースホルダ（見本・検証用） */
const IMG = {
  a: 'https://placehold.co/96x72/C45C26/FFFFFF/png?text=1945',
  b: 'https://placehold.co/96x72/1565C0/FFFFFF/png?text=1964',
  c: 'https://placehold.co/96x72/2E7D32/FFFFFF/png?text=EXPO',
  d: 'https://placehold.co/96x72/5B4B8A/FFFFFF/png?text=IT',
};

const sampleSheets = {
  政治: [
    HEADER,
    [1945, '終戦', null, null, '#5D4037', null, IMG.a],
    [1955, '55年体制', 1993, 12, '#1565C0', 'label', null],
    [1960, '安保闘争', null, null, '#C45C26', null, null],
    [1989, '平成', null, 13, '#1F7A6C', 'label', null],
    [2011, '東日本大震災', null, 14, '#B33A3A', null, null],
  ],
  経済: [
    HEADER,
    [1955, '高度経済成長', 1973, 13, '#C45C26', 'label', null],
    [1973, 'オイルショック', null, null, '#E65100', null, null],
    [1986, 'バブル景気', 1991, 12, '#6A1B9A', 'label', null],
    [2008, 'リーマンショック', 2009, null, '#455A64', null, null],
    [2020, 'コロナ禍', 2022, 11, '#00838F', null, null],
  ],
  '文化・社会': [
    HEADER,
    [1964, '東京オリンピック', null, null, '#1565C0', null, IMG.b],
    [1970, '大阪万博', null, null, '#2E7D32', null, IMG.c],
    [1995, '阪神・淡路大震災', null, null, '#5D4037', null, null],
    [2000, 'ITバブル前後', 2001, null, '#5B4B8A', null, IMG.d],
    [2021, '東京五輪（延期開催）', null, 12, '#AD1457', null, null],
  ],
};

const testSheets = {
  '1_点テキスト': [
    HEADER,
    [1900, 'デフォルト黒文字', null, null, null, null, null],
    [1920, '青い文字', null, null, '#1565C0', null, null],
    [1940, '大きい赤字', null, 16, '#B33A3A', null, null],
    [1960, '小さい紫', null, 9, '#5B4B8A', null, null],
    [1985, '緑14px', null, 14, '#2E7D32', 'text', null],
    [2000, '英語 sample', null, 12, '#E65100', null, null],
    [2015, 'あいうえお', null, 11, '#00838F', null, null],
  ],
  '2_期間バー': [
    HEADER,
    [1910, '短い期間バー', 1925, null, '#5D4037', null, null],
    [1930, '中くらいの期間', 1955, 12, '#C45C26', null, null],
    [1945, '点イベント挟み', null, null, '#1565C0', null, null],
    [1960, '長い期間バー', 1990, 11, '#1F7A6C', null, null],
    [1970, '重なり確認用の点', null, null, '#AD1457', null, null],
    [1995, '短い期間2', 2005, null, '#455A64', null, null],
  ],
  '3_ラベルボックス': [
    HEADER,
    [1910, 'デモクラシー時代', null, 13, '#C45C26', 'label', null],
    [1920, '点ラベル', null, 11, '#5B4B8A', 'label', null],
    [1940, '高度成長', null, 14, '#1565C0', 'label', null],
    [1950, '短いラベル', null, 12, '#1F7A6C', 'ラベル', null],
    [1970, 'バブルへ', null, 13, '#B33A3A', 'label', null],
    [1985, 'カラー試験', null, 12, '#E65100', 'label', null],
    [1915, '長いラベル幅確認', null, 11, '#6A1B9A', 'label', null],
  ],
  '4_混在パターン': [
    HEADER,
    [1900, '通常テキスト', null, null, '#000000', null, null],
    [1910, 'ラベル（期間は見た目無視）', 1940, 13, '#5B4B8A', 'label', null],
    [1925, '色付き点', null, null, '#C2185B', null, null],
    [1935, '期間バー', 1955, null, '#2E7D32', null, null],
    [1950, 'ラベル点', null, 12, '#00838F', 'label', null],
    [1960, 'ラベル長文言テストABC', null, 14, '#1565C0', 'label', null],
    [1975, '大きい文字', null, 18, '#E65100', null, null],
    [1988, 'バー短め', 2000, 11, '#5D4037', 'default', null],
  ],
  '5_境界値': [
    HEADER,
    [1900, '最小フォント', null, 8, '#37474F', null, null],
    [1910, '最大フォント', null, 48, '#B33A3A', null, null],
    [1920, '1年だけ期間', 1921, null, '#1565C0', null, null],
    [1930, '1年ラベル', null, 12, '#C45C26', 'label', null],
    [1940, 'RGB指定', null, 11, 'rgb(21,101,192)', null, null],
    [1950, '3桁色', null, null, '#F0A', null, null],
    [1960, '長いラベルボックス文言テストABC', null, 11, '#6A1B9A', 'label', null],
    [1980, '【検証用】無効スタイルbox', null, 11, '#000000', 'box', null],
    [1990, '画像付き点', null, 12, '#1565C0', null, IMG.b],
    [1995, '【検証用】無効画像URL', null, null, null, null, 'not-a-url'],
    [2000, '【検証用】data URI拒否', null, null, null, null, 'data:image/png;base64,AAAA'],
  ],
};

function writeWorkbook(sheets, outPath) {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 8 },
      { wch: 28 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  XLSX.writeFile(wb, outPath);
  console.log('wrote', outPath);
}

writeWorkbook(sampleSheets, path.join(root, 'public/template_sample.xlsx'));
writeWorkbook(testSheets, path.join(root, 'public/template_test.xlsx'));
