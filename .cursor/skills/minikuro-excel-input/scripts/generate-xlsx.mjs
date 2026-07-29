#!/usr/bin/env node
/**
 * ミニクロ用 .xlsx を JSON から生成する。
 * Usage:
 *   node generate-xlsx.mjs --out out.xlsx --input data.json
 *   node generate-xlsx.mjs --out out.xlsx < data.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveXlsx() {
  const candidates = [
    path.resolve(__dirname, '../../../../node_modules/xlsx'),
    path.resolve(process.cwd(), 'node_modules/xlsx'),
  ];
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      // continue
    }
  }
  console.error('xlsx が見つかりません。リポジトリ根で npm install してください。');
  process.exit(1);
}

const XLSX = resolveXlsx();

const HEADER = ['年', '出来事', '(いつまで)', 'フォントサイズ', '色', '表示スタイル', '画像リンク'];

function parseArgs(argv) {
  const out = { out: null, input: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--out') out.out = argv[++i];
    else if (argv[i] === '--input') out.input = argv[++i];
  }
  return out;
}

function readJson(inputPath) {
  if (inputPath) {
    return JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  }
  const stdin = fs.readFileSync(0, 'utf8');
  if (!stdin.trim()) {
    console.error('JSON を --input か stdin で渡してください。');
    process.exit(1);
  }
  return JSON.parse(stdin);
}

function validate(data) {
  const warnings = [];
  if (!data?.sheets || !Array.isArray(data.sheets) || data.sheets.length === 0) {
    throw new Error('sheets 配列が必要です');
  }
  if (data.sheets.length > 5) {
    warnings.push(`シートが ${data.sheets.length} 件あります（アプリは先頭5件のみ使用）`);
  }

  let minY = Infinity;
  let maxY = -Infinity;

  data.sheets.forEach((sheet, si) => {
    if (!sheet.name || String(sheet.name).trim() === '') {
      throw new Error(`sheets[${si}].name が空です`);
    }
    (sheet.rows || []).forEach((row, ri) => {
      if (row.start == null || row.label == null || String(row.label).trim() === '') {
        throw new Error(`「${sheet.name}」行${ri + 1}: start と label は必須です`);
      }
      const start = Number(row.start);
      if (!Number.isFinite(start) || start < 1 || start > 9999) {
        throw new Error(`「${sheet.name}」行${ri + 1}: start が無効です`);
      }
      minY = Math.min(minY, start);
      maxY = Math.max(maxY, start);
      if (row.end != null && row.end !== '') {
        const end = Number(row.end);
        if (!Number.isFinite(end) || end < start) {
          warnings.push(`「${sheet.name}」行${ri + 1}: end が start 未満の可能性があります`);
        } else {
          maxY = Math.max(maxY, end);
        }
      }
      if (row.fontSize != null && row.fontSize !== '') {
        const fsNum = Number(row.fontSize);
        if (!Number.isFinite(fsNum) || fsNum < 8 || fsNum > 48) {
          warnings.push(`「${sheet.name}」行${ri + 1}: fontSize は 8〜48 推奨`);
        }
      }
      if (row.style != null && String(row.style).trim() !== '') {
        const s = String(row.style).trim().toLowerCase();
        const ok = ['label', 'ラベル', 'default', 'デフォルト', 'text', 'テキスト'].includes(s);
        if (!ok) {
          warnings.push(
            `「${sheet.name}」行${ri + 1}: style「${row.style}」はアプリで無効（空欄または label）`
          );
        }
      }
    });
  });

  if (Number.isFinite(minY) && Number.isFinite(maxY) && maxY - minY > 2000) {
    warnings.push(`年幅が ${maxY - minY} 年です（アプリ上限 2000 年）`);
  }

  return warnings;
}

function rowToAoa(row) {
  return [
    row.start,
    row.label,
    row.end ?? null,
    row.fontSize ?? null,
    row.color ?? null,
    row.style ?? null,
    row.imageUrl ?? row.image ?? null,
  ];
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.out) {
    console.error('必須: --out path/to/file.xlsx');
    process.exit(1);
  }

  const data = readJson(args.input);
  const warnings = validate(data);
  warnings.forEach((w) => console.warn(`警告: ${w}`));

  const wb = XLSX.utils.book_new();
  data.sheets.slice(0, 5).forEach((sheet) => {
    const aoa = [HEADER, ...(sheet.rows || []).map(rowToAoa)];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [
      { wch: 8 },
      { wch: 28 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 40 },
    ];
    const safeName = String(sheet.name).slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  });

  const outPath = path.resolve(args.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  XLSX.writeFile(wb, outPath);
  console.log(`Wrote ${outPath}`);
}

main();
