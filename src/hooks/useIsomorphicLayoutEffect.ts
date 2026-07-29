import { useEffect, useLayoutEffect } from 'react';

/**
 * 描画前に同期させたい副作用用。
 * SSR では useLayoutEffect が使えないため useEffect に落とす。
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
