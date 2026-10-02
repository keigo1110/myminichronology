import { parseExcelBuffer } from '../lib/parseExcelBuffer';
import { isAppMessageError } from '../i18n/errors';

self.onmessage = async ({ data }: MessageEvent<ArrayBuffer>) => {
  try {
    self.postMessage({ result: await parseExcelBuffer(data) });
  } catch (error) {
    self.postMessage({ error: isAppMessageError(error)
      ? { code: error.code, params: error.params }
      : { code: 'parse.failedGeneric' } });
  }
};
