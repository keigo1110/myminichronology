const IMAGE_TIMEOUT_MS = 5_000;
const IMAGE_BUDGET_MS = 15_000;
const IMAGE_CONCURRENCY = 4;
const THUMBNAIL_SCALE = 3;

/** 一度だけ取得した画像を小さなPNGへ固定し、ページごとの再取得をなくす。 */
async function imageAsPng(src: string, signal: AbortSignal): Promise<string> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.referrerPolicy = 'no-referrer';
  image.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      image.onload = null;
      image.onerror = null;
    };
    const fail = (error: unknown) => { cleanup(); image.src = ''; reject(error); };
    const abort = () => fail(signal.reason);
    const timeout = setTimeout(() => fail(new Error('Image timeout')), IMAGE_TIMEOUT_MS);
    image.onload = () => { cleanup(); resolve(); };
    image.onerror = () => fail(new Error('Image unavailable'));
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) { abort(); return; }
    image.src = src;
  });
  signal.throwIfAborted();
  if (image.naturalWidth <= 0 || image.naturalHeight <= 0) throw new Error('Image is empty');
  const scale = Math.min(1, 72 * THUMBNAIL_SCALE / image.naturalWidth, 54 * THUMBNAIL_SCALE / image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.ceil(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image canvas unavailable');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  try { return canvas.toDataURL('image/png'); }
  finally { canvas.width = 1; canvas.height = 1; image.src = ''; }
}

export async function freezePdfImages(root: HTMLElement, missingLabel: string, signal?: AbortSignal): Promise<number> {
  signal?.throwIfAborted();
  let missing = root.querySelectorAll('[data-image-status="failed"]').length;
  const groups = new Map<string, HTMLImageElement[]>();
  root.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
    const src = image.src;
    const group = groups.get(src);
    if (group) group.push(image);
    else groups.set(src, [image]);
  });
  if (!groups.size) return missing;
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(() => controller.abort(new Error('Image budget exceeded')), IMAGE_BUDGET_MS);
  const entries = Array.from(groups);
  let next = 0;
  try {
    await Promise.all(Array.from({ length: Math.min(IMAGE_CONCURRENCY, entries.length) }, async () => {
      while (next < entries.length) {
        signal?.throwIfAborted();
        const [src, images] = entries[next++];
        let png: string | null = null;
        if (!controller.signal.aborted) {
          try { png = await imageAsPng(src, controller.signal); }
          catch { signal?.throwIfAborted(); }
        }
        for (const image of images) {
          if (png) {
            image.removeAttribute('srcset');
            image.loading = 'eager';
            image.src = png;
            await image.decode().catch(() => {});
          } else {
            const label = root.ownerDocument.createElement('span');
            label.textContent = missingLabel;
            label.style.fontSize = '10px';
            image.replaceWith(label);
            missing++;
          }
        }
      }
    }));
    signal?.throwIfAborted();
    return missing;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
