import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';

/** LocaleProvider がブラウザ言語で en に切り替わらないよう、テストでは ja を固定 */
beforeEach(() => {
  try {
    window.localStorage.setItem('minikuro-locale', 'ja');
  } catch {
    // ignore
  }
});
