import type { MessageKey } from './messages';
import type { MessageParams } from './types';

/** 翻訳可能なアプリエラー（UI で t(code, params) する） */
export class AppMessageError extends Error {
  readonly code: MessageKey;
  readonly params?: MessageParams;

  constructor(code: MessageKey, params?: MessageParams) {
    super(code);
    this.name = 'AppMessageError';
    this.code = code;
    this.params = params;
  }
}

export function isAppMessageError(error: unknown): error is AppMessageError {
  return error instanceof AppMessageError;
}

export type StoredAppError = {
  code: MessageKey;
  params?: MessageParams;
};

export function toStoredAppError(error: unknown, fallback: MessageKey): StoredAppError {
  if (isAppMessageError(error)) {
    return { code: error.code, params: error.params };
  }
  if (error instanceof Error && error.message) {
    // 既存の生メッセージをそのまま出したい場合のフォールバック用コードは呼び出し側で扱う
    return { code: fallback, params: { detail: error.message } };
  }
  return { code: fallback };
}
