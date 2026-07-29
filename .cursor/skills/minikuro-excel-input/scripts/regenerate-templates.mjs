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

const HEADER = ['年', '出来事', '(いつまで)', 'フォントサイズ', '色', '表示スタイル'];

const sampleSheets = {
  政治: [
    HEADER,
    [1945, '終戦', null, null, '#5D4037', null],
    [1955, '55年体制', 1993, 12, '#1565C0', 'label'],
    [1960, '安保闘争', null, null, '#C45C26', null],
    [1989, '平成', null, 13, '#1F7A6C', 'label'],
    [2011, '東日本大震災', null, 14, '#B33A3A', null],
  ],
  経済: [
    HEADER,
    [1955, '高度経済成長', 1973, 13, '#C45C26', 'label'],
    [1973, 'オイルショック', null, null, '#E65100', null],
    [1986, 'バブル景気', 1991, 12, '#6A1B9A', 'label'],
    [2008, 'リーマンショック', 2009, null, '#455A64', null],
    [2020, 'コロナ禍', 2022, 11, '#00838F', null],
  ],
  '文化・社会': [
    HEADER,
    [1964, '東京オリンピック', null, null, '#1565C0', null],
    [1970, '大阪万博', null, null, '#2E7D32', null],
    [1995, '阪神・淡路大震災', null, null, '#5D4037', null],
    [2000, 'ITバブル前後', 2001, null, '#5B4B8A', null],
    [2021, '東京五輪（延期開催）', null, 12, '#AD1457', null],
  ],
};

const testSheets = {
  '1_点テキスト': [
    HEADER,
    [1900, 'デフォルト黒文字', null, null, null, null],
    [1920, '青い文字', null, null, '#1565C0', null],
    [1940, '大きい赤字', null, 16, '#B33A3A', null],
    [1960, '小さい紫', null, 9, '#5B4B8A', null],
    [1985, '緑14px', null, 14, '#2E7D32', 'text'],
    [2000, '英語 sample', null, 12, '#E65100', null],
    [2015, 'あいうえお', null, 11, '#00838F', null],
  ],
  '2_期間バー': [
    HEADER,
    [1910, '短い期間バー', 1925, null, '#5D4037', null],
    [1930, '中くらいの期間', 1955, 12, '#C45C26', null],
    [1945, '点イベント挟み', null, null, '#1565C0', null],
    [1960, '長い期間バー', 1990, 11, '#1F7A6C', null],
    [1970, '重なり確認用の点', null, null, '#AD1457', null],
    [1995, '短い期間2', 2005, null, '#455A64', null],
  ],
  '3_ラベルボックス': [
    HEADER,
    [1910, 'デモクラシー時代', null, 13, '#C45C26', 'label'],
    [1920, '点ラベル', null, 11, '#5B4B8A', 'label'],
    [1940, '高度成長', null, 14, '#1565C0', 'label'],
    [1950, '短いラベル', null, 12, '#1F7A6C', 'ラベル'],
    [1970, 'バブルへ', null, 13, '#B33A3A', 'label'],
    [1985, 'カラー試験', null, 12, '#E65100', 'label'],
    [1915, '長いラベル幅確認', null, 11, '#6A1B9A', 'label'],
  ],
  '4_混在パターン': [
    HEADER,
    [1900, '通常テキスト', null, null, '#000000', null],
    [1910, 'ラベル（期間は見た目無視）', 1940, 13, '#5B4B8A', 'label'],
    [1925, '色付き点', null, null, '#C2185B', null],
    [1935, '期間バー', 1955, null, '#2E7D32', null],
    [1950, 'ラベル点', null, 12, '#00838F', 'label'],
    [1960, 'ラベル長文言テストABC', null, 14, '#1565C0', 'label'],
    [1975, '大きい文字', null, 18, '#E65100', null],
    [1988, 'バー短め', 2000, 11, '#5D4037', 'default'],
  ],
  '5_境界値': [
    HEADER,
    [1900, '最小フォント', null, 8, '#37474F', null],
    [1910, '最大フォント', null, 48, '#B33A3A', null],
    [1920, '1年だけ期間', 1921, null, '#1565C0', null],
    [1930, '1年ラベル', null, 12, '#C45C26', 'label'],
    [1940, 'RGB指定', null, 11, 'rgb(21,101,192)', null],
    [1950, '3桁色', null, null, '#F0A', null],
    [1960, '長いラベルボックス文言テストABC', null, 11, '#6A1B9A', 'label'],
    [1980, '【検証用】無効スタイルbox', null, 11, '#000000', 'box'],
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
    ];
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  XLSX.writeFile(wb, outPath);
  console.log('wrote', outPath);
}

writeWorkbook(sampleSheets, path.join(root, 'public/template_sample.xlsx'));
writeWorkbook(testSheets, path.join(root, 'public/template_test.xlsx'));
