import type { ParseResult, TimelineData } from './types';
import { AppMessageError } from '../i18n/errors';
import { validateExcelFile } from './fileValidation';
import { parseExcelBuffer } from './parseExcelBuffer';
import { abortable } from './abortable';
export * from './parseExcelBuffer';

async function readFileAsArrayBuffer(file: Blob): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new AppMessageError('parse.failedGeneric'));
    reader.readAsArrayBuffer(file);
  });
}

/** ブラウザでは解析を専用 Worker へ渡す。古い読み込みは中断して CPU も解放する。 */
export async function parseExcel(file: File, signal?: AbortSignal): Promise<ParseResult> {
  const validationError = validateExcelFile(file);
  if (validationError) throw new AppMessageError(validationError);
  signal?.throwIfAborted();
  const buffer = await abortable(readFileAsArrayBuffer(file), signal);
  signal?.throwIfAborted();
  if (typeof Worker === 'undefined') return parseExcelBuffer(buffer);

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/parseExcel.worker.ts', import.meta.url), { type: 'module' });
    const timeout = setTimeout(() => {
      cleanup();
      reject(new AppMessageError('parse.timedOut'));
    }, 30_000);
    const cleanup = () => {
      clearTimeout(timeout);
      worker.terminate();
      worker.onmessage = null;
      worker.onerror = null;
      signal?.removeEventListener('abort', abort);
    };
    const abort = () => {
      cleanup();
      reject(new DOMException('Reading cancelled', 'AbortError'));
    };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) { abort(); return; }
    worker.onmessage = ({ data }: MessageEvent<
      { result: ParseResult } | { error: { code: ConstructorParameters<typeof AppMessageError>[0]; params?: ConstructorParameters<typeof AppMessageError>[1] } }
    >) => {
      cleanup();
      if ('result' in data) resolve(data.result);
      else reject(new AppMessageError(data.error.code, data.error.params));
    };
    worker.onerror = () => {
      cleanup();
      reject(new AppMessageError('parse.failedGeneric'));
    };
    try { worker.postMessage(buffer, [buffer]); }
    catch (error) { cleanup(); reject(error); }
  });
}

export async function parseExcelLanes(file: File): Promise<TimelineData> {
  const result = await parseExcel(file);
  return result.lanes;
}
