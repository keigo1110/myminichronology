import { test, expect, type Page } from '@playwright/test';
import * as XLSX from 'xlsx';
import { readFile, writeFile } from 'node:fs/promises';

const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
function workbook(sheets: Record<string, unknown[][]>) {
  const book = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => XLSX.utils.book_append_sheet(book,
    XLSX.utils.aoa_to_sheet([['年', '出来事', '(いつまで)', 'フォントサイズ', '色', '表示スタイル'], ...rows]), name));
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx', compression: true }) as Buffer;
}
async function upload(page: Page, buffer: Buffer, name = 'test.xlsx') {
  await page.locator('input[type=file]').setInputFiles({ name, mimeType, buffer });
}
async function settings(page: Page) {
  await expect(page.locator('#timelineRoot')).toBeVisible();
  const open = page.getByRole('button', { name: '表示範囲の設定を開く' });
  if (await open.count()) await open.click();
}
test.beforeEach(async ({ page }) => {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') failures.push(message.text()); });
  (page as Page & { appFailures: string[] }).appFailures = failures;
  await page.goto('/');
});
test.afterEach(async ({ page }) => {
  expect((page as Page & { appFailures: string[] }).appFailures).toEqual([]);
});

test('settings survive layout changes and failed replacement; touch controls and details work', async ({ page }, testInfo) => {
  await upload(page, workbook({ A: [[2000, 'Target'], [2010, 'Other']], B: [[2005, 'Hidden']] }));
  await expect(page.getByRole('button', { name: /2000.*Target/ })).toBeVisible();
  if (testInfo.project.name.includes('mobile')) {
    expect((await page.locator('header').boundingBox())!.height).toBeLessThan(180);
  }
  await page.screenshot({ path: `/tmp/minikuro-fixed-${testInfo.project.name}.png` });
  await settings(page);
  await expect(page.getByRole('button', { name: 'A', exact: true })).toHaveCSS('background-color', 'rgb(196, 92, 38)');
  await page.getByRole('button', { name: 'B', exact: true }).click();
  await page.getByRole('button', { name: 'Bを前へ移動' }).click();
  const search = page.getByRole('textbox', { name: '表示中の出来事を検索' });
  await search.fill('Target');
  await page.getByRole('slider').press('ArrowRight');
  await page.getByRole('button', { name: '縦横入れ替え' }).click();
  await expect(search).toHaveValue('Target');
  await expect(page.getByRole('button', { name: 'B', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'Bを前へ移動' })).toBeDisabled();
  await upload(page, workbook({ Broken: [['bad', 'invalid']] }));
  await expect(page.locator('main').getByRole('alert')).toContainText('有効なデータ');
  await expect(page.getByRole('button', { name: /2000.*Target/ })).toBeVisible();
  await expect(search).toHaveValue('Target');
  await page.getByRole('button', { name: /2000.*Target/ }).press('Enter');
  await expect(page.getByRole('dialog')).toContainText('Target');
  await page.getByRole('button', { name: '閉じる', exact: true }).click();
});

test('the parser uses a Worker, accepts early years, and keeps period endpoints', async ({ page }) => {
  let workerCount = 0; page.on('worker', () => workerCount++);
  await upload(page, workbook({ Early: [[1, 'early'], [9, 'later']] }));
  await expect(page.getByRole('button', { name: /1.*early/ })).toBeVisible();
  expect(workerCount).toBeGreaterThan(0);
  await settings(page);
  await expect(page.getByRole('spinbutton', { name: '開始年' })).toHaveValue('0');
  await upload(page, workbook({ Ranges: Array.from({ length: 20 }, (_, i) => [2000, `range ${i}`, 2010]) }));
  await expect(page.locator('[data-event-label]')).toHaveCount(20);
  const bounds = await page.locator('[data-event-label]').evaluateAll((elements) => elements.map((el) => {
    const rect = el.getBoundingClientRect(); return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
  }));
  const root = await page.locator('#timelineRoot').boundingBox();
  expect(new Set(bounds.map((rect) => rect.top)).size).toBe(1);
  expect(new Set(bounds.map((rect) => rect.bottom)).size).toBe(1);
  expect(Math.max(...bounds.map((rect) => rect.bottom))).toBeLessThanOrEqual(root!.y + root!.height);
});

test('large timelines mount only visible events and can search to an unmounted match', async ({ page }) => {
  await upload(page, workbook({ Dense: Array.from({ length: 3200 }, (_, i) => [2000, `Event ${String(i).padStart(4, '0')}`]) }));
  await expect(page.locator('#timelineRoot')).toBeVisible();
  await expect.poll(() => page.locator('[data-event-label]').count()).toBeLessThan(300);
  await settings(page);
  await page.getByRole('textbox', { name: '表示中の出来事を検索' }).fill('Event 3199');
  await expect(page.getByRole('button', { name: /Event 3199/ })).toBeInViewport();
  expect(await page.locator('[data-timeline-viewport]').evaluate((el) => el.scrollTop)).toBeGreaterThan(1000);
  await page.getByRole('button', { name: '縦横入れ替え' }).click();
  await expect(page.getByRole('button', { name: /Event 3199/ })).toBeInViewport();
});

test('newer reads win a race and limits preserve the previous timeline', async ({ page }) => {
  await page.evaluate(() => {
    const original = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = async function () {
      if (this.name === 'slow.xlsx') await new Promise((resolve) => setTimeout(resolve, 500));
      return original.call(this);
    };
  });
  await upload(page, workbook({ Slow: [[2000, 'slow']] }), 'slow.xlsx');
  await upload(page, workbook({ Fast: [[2010, 'fast']] }), 'fast.xlsx');
  await expect(page.getByRole('button', { name: /2010.*fast/ })).toBeVisible();
  await page.waitForTimeout(600);
  await expect(page.getByRole('button', { name: /2000.*slow/ })).toHaveCount(0);
  await upload(page, workbook({ TooMany: Array.from({ length: 5001 }, () => [2000, 'event']) }));
  await expect(page.locator('main').getByRole('alert')).toContainText('最大5000件');
  await expect(page.getByRole('button', { name: /2010.*fast/ })).toBeVisible();
});

test('internal lane drops do not trigger file errors', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Touch uses the tested reorder buttons.');
  await upload(page, workbook({ A: [[2000, 'a']], B: [[2000, 'b']] }));
  await settings(page);
  await page.getByRole('button', { name: 'A', exact: true }).dragTo(page.getByRole('button', { name: 'B', exact: true }));
  await expect(page.getByRole('button', { name: 'Bを前へ移動' })).toBeDisabled();
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
});

test('in-place filtering retains positions and warnings expose every skipped row', async ({ page }) => {
  await upload(page, workbook({ Test: [[2000, 'keep'], [2005, 'after'], [2010, 'last'], ...Array.from({ length: 5 }, (_, i) => ['bad', `invalid ${i}`])] }));
  await expect(page.getByRole('button', { name: /2005.*after/ })).toBeVisible();
  await page.getByRole('button', { name: '詳細を表示（5件）' }).click();
  await expect(page.locator('main').getByRole('alert').locator('li')).toHaveCount(5);
  await settings(page);
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: '位置はそのまま' }).click();
  const position = () => page.getByRole('button', { name: /2005.*after/ }).evaluate((el) => ({ top: (el as HTMLElement).style.top, className: el.className }));
  const before = await position();
  const start = page.getByRole('spinbutton', { name: '開始年' });
  await start.fill('2005'); await start.press('Tab');
  await expect(page.getByRole('spinbutton', { name: '終了年' })).toBeFocused();
  await expect(page.getByRole('button', { name: /2000.*keep/ })).toHaveCount(0);
  expect(await position()).toEqual(before);
  await page.getByRole('button', { name: '出来事ラベルを横書きに切替' }).click();
  await expect(page.getByRole('spinbutton', { name: '開始年' })).toHaveValue('2005');
});

test('multi-page PDFs render a frozen snapshot, including offscreen events', async ({ page }) => {
  test.setTimeout(120_000);
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 72; canvas.height = 54;
    const context = canvas.getContext('2d')!; context.fillStyle = '#00aa22'; context.fillRect(0, 0, 72, 54);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.route('https://example.com/pdf-image.png', (route) => route.fulfill({ contentType: 'image/png', headers: { 'Access-Control-Allow-Origin': '*' }, body: Buffer.from(png, 'base64') }));
  await upload(page, workbook({ PDF: Array.from({ length: 230 }, (_, i) => [2000 + Math.floor(i / 23), `出来事 ${String(i).padStart(3, '0')}`, null, 12, '#1565C0', null, i % 23 === 0 ? 'https://example.com/pdf-image.png' : null]) }));
  await expect(page.locator('#timelineRoot')).toBeVisible();
  await page.evaluate(() => {
    const state = window as unknown as { frames: string[]; mutate: boolean; snapshotEvents: number; controlsLocked: boolean };
    state.frames = []; state.mutate = false;
    const original = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
      const data = original.apply(this, args);
      if (args[0] === 'image/png' && (this.width > 1000 || this.height > 1000)) {
        state.frames.push(data);
        const snapshot = document.querySelector<HTMLIFrameElement>('iframe[title="PDF snapshot"]');
        state.snapshotEvents = snapshot?.contentDocument?.querySelectorAll('[data-event-label]').length ?? 0;
        state.controlsLocked = document.querySelector('header')?.hasAttribute('inert') ?? false;
        const images = Array.from(snapshot?.contentDocument?.querySelectorAll('img') ?? []);
        if (images.length && images.some((image) => !image.src.startsWith('data:image/png'))) throw new Error('PDF image was not frozen');
        if (state.mutate && state.frames.length === 1) {
          const root = document.getElementById('timelineRoot')!;
          root.style.backgroundColor = 'magenta';
          root.querySelectorAll('[data-event-label] .MuiTypography-root').forEach((el) => { el.textContent = 'CHANGED'; });
        }
      }
      return data;
    };
  });
  async function capture(mutate: boolean) {
    await page.evaluate((mutate) => {
      const state = window as unknown as { frames: string[]; mutate: boolean };
      state.frames = []; state.mutate = mutate;
    }, mutate);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDFエクスポート', exact: true }).click();
    const download = await downloadPromise;
    const result = await page.evaluate(() => {
      const state = window as unknown as { frames: string[]; snapshotEvents: number; controlsLocked: boolean };
      return { frames: state.frames, snapshotEvents: state.snapshotEvents, controlsLocked: state.controlsLocked };
    });
    const pdf = await readFile((await download.path())!);
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect((pdf.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length).toBe(result.frames.length);
    expect(result.snapshotEvents).toBe(230); expect(result.controlsLocked).toBe(true);
    await expect(page.locator('iframe[title="PDF snapshot"]')).toHaveCount(0);
    return result.frames;
  }
  const baseline = await capture(false);
  expect(baseline.length).toBeGreaterThan(1);
  const changed = await capture(true);
  expect(changed).toEqual(baseline);
  await writeFile('/tmp/minikuro-fixed-pdf-page.png', Buffer.from(baseline[0].split(',')[1], 'base64'));
  const nonBlank = await page.evaluate(async (data) => {
    const image = new Image(); image.src = data; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let colored = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 200 && pixels[i + 1] < 200 && pixels[i + 2] < 255) colored++;
    return colored;
  }, baseline[0]);
  expect(nonBlank).toBeGreaterThan(1000);
});

test('year fields can be cleared and keyboard focus survives virtual scrolling', async ({ page }) => {
  await upload(page, workbook({ Dense: Array.from({ length: 500 }, (_, i) => [2000 + Math.floor(i / 50), `Event ${i}`]) }));
  await expect(page.locator('#timelineRoot')).toBeVisible();
  await settings(page);
  const start = page.getByRole('spinbutton', { name: '開始年' });
  await start.fill(''); await expect(start).toHaveValue('');
  await start.fill('2001'); await start.press('Tab');
  await expect(page.getByRole('spinbutton', { name: '終了年' })).toBeFocused();
  await expect(start).toHaveValue('2001');
  const first = page.locator('[data-event-label]').first();
  const id = await first.getAttribute('id');
  await first.focus();
  await page.locator('[data-timeline-viewport]').evaluate((el) => { el.scrollTop = el.scrollHeight - el.clientHeight; });
  await expect.poll(() => page.locator('[data-event-label]').count()).toBeLessThan(300);
  await expect(page.locator(`[id="${id}"]`)).toBeFocused();
  await page.locator(`[id="${id}"]`).press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('PDF cancellation cleans up the snapshot and restores controls without downloading', async ({ page }) => {
  await upload(page, workbook({ PDF: Array.from({ length: 230 }, (_, i) => [2000 + Math.floor(i / 23), `出来事 ${i}`]) }));
  await expect(page.locator('#timelineRoot')).toBeVisible();
  let downloads = 0; page.on('download', () => downloads++);
  await page.getByRole('button', { name: 'PDFエクスポート', exact: true }).click();
  await page.getByRole('button', { name: 'PDF生成を中止', exact: true }).click();
  await expect(page.getByRole('button', { name: 'PDFエクスポート', exact: true })).toBeEnabled();
  await expect(page.locator('iframe[title="PDF snapshot"]')).toHaveCount(0);
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
  expect(downloads).toBe(0);
});

test('initial styles and saved preferences survive repeated page reloads', async ({ page }) => {
  for (let index = 0; index < 5; index++) {
    await page.reload();
    await expect(page.getByRole('button', { name: 'Excelファイルをアップロード' })).toBeVisible();
    await expect(page.locator('main')).toHaveCSS('background-color', 'rgb(247, 244, 238)');
  }
  await page.getByRole('button', { name: 'ダークモードに切替' }).click();
  await page.getByRole('button', { name: 'Switch to English' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Upload Excel file' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'dark');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('unavailable PDF images produce a visible notice after saving', async ({ page }) => {
  await page.route('https://example.com/missing.png', (route) => route.fulfill({
    contentType: 'image/png', headers: { 'Access-Control-Allow-Origin': '*' }, body: Buffer.from('unavailable'),
  }));
  await upload(page, workbook({ Image: [[2000, 'Image event', null, 12, null, null, 'https://example.com/missing.png']] }));
  await expect(page.locator('[data-image-status="failed"]')).toHaveCount(1);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDFエクスポート', exact: true }).click();
  await download;
  await expect(page.locator('main').getByRole('alert')).toContainText('取得できなかった画像1件');
  await expect(page.getByRole('button', { name: 'PDFエクスポート', exact: true })).toBeEnabled();
  await upload(page, workbook({ New: [[2000, 'New event']] }));
  await expect(page.getByRole('button', { name: /2000.*New event/ })).toBeVisible();
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
});
