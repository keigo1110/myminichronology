import type { ParseErrorType, ParseWarning } from './types';
import type { MessageKey } from '../i18n/messages';
import type { MessageParams } from '../i18n/types';
import { MAX_PARSE_WARNINGS } from './fileValidation';

export function pushParseWarning(
  warnings: ParseWarning[],
  type: ParseErrorType,
  code: MessageKey,
  params?: MessageParams,
  sheet?: string,
  row?: number
) {
  if (warnings.length >= MAX_PARSE_WARNINGS) {
    const last = warnings.at(-1);
    if (last?.type === 'warning-limit') {
      last.params!.count = Number(last.params!.count) + 1;
    } else {
      warnings.push({ type: 'warning-limit', code: 'parse.moreWarnings', params: { count: 1, max: MAX_PARSE_WARNINGS } });
    }
    return;
  }
  const value = params?.value;
  const safeParams = typeof value === 'string' && value.length > 120
    ? { ...params, value: `${value.slice(0, 120)}…` } : params;
  warnings.push({ type, code, params: safeParams, sheet, row });
}
