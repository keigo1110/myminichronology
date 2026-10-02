/** CSSOM と年表 DOM を専用文書に固定し、複数ページを同じ状態から描画する。 */
export function createPdfSnapshot(source: HTMLElement): { element: HTMLElement; dispose: () => void } {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('title', 'PDF snapshot');
  iframe.style.cssText = `position:fixed;left:-100000px;top:0;border:0;pointer-events:none;width:${source.scrollWidth}px;height:1000px;`;
  document.body.appendChild(iframe);
  try {
    const doc = iframe.contentDocument;
    if (!doc) throw new Error('PDF snapshot document is unavailable');
    for (const attribute of document.documentElement.attributes) {
      doc.documentElement.setAttribute(attribute.name, attribute.value);
    }
    const css = document.createElement('style');
    // Emotion の style タグは空でも、CSSOM には挿入済みルールがある。
    css.textContent = Array.from(document.styleSheets, (sheet) =>
      Array.from(sheet.cssRules, (rule) => rule.cssText).join('\n')
    ).join('\n');
    doc.head.appendChild(css);
    doc.body.style.margin = '0';
    const element = source.cloneNode(true) as HTMLElement;
    element.id = 'pdfSnapshotRoot';
    element.style.margin = '0';
    element.style.width = `${source.scrollWidth}px`;
    doc.body.appendChild(element);
    return { element, dispose: () => iframe.remove() };
  } catch (error) {
    iframe.remove();
    throw error;
  }
}
