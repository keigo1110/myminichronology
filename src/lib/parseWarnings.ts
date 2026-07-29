import type { ParseErrorType, ParseWarning } from './types';
import type { MessageKey } from '../i18n/messages';
import type { MessageParams } from '../i18n/types';

export function pushParseWarning(
  warnings: ParseWarning[],
  type: ParseErrorType,
  code: MessageKey,
  params?: MessageParams,
  sheet?: string,
  row?: number
) {
  warnings.push({ type, code, params, sheet, row });
}
