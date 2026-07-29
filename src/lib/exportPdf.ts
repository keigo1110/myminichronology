// A4 landscape dimensions in mm
const A4_LANDSCAPE_WIDTH_MM = 297;
const A4_LANDSCAPE_HEIGHT_MM = 210;

/** ブラウザのキャンバス上限を考慮した目標ピクセル予算 */
const MAX_CANVAS_DIMENSION = 8192;
const MAX_CANVAS_PIXELS = 16_777_216; // ~16MP

function computeSafeScale(width: number, height: number, preferredScale = 3): number {
  if (width <= 0 || height <= 0) return 1;

  const maxByDimension = Math.min(
    MAX_CANVAS_DIMENSION / width,
    MAX_CANVAS_DIMENSION / height
  );
  const maxByPixels = Math.sqrt(MAX_CANVAS_PIXELS / (width * height));

  return Math.max(1, Math.min(preferredScale, maxByDimension, maxByPixels));
}

/**
 * 縦長年表は縦方向にページ分割、横長年表は横方向にページ分割する。
 */
function buildPdfPages(
  canvas: HTMLCanvasElement,
  pdf: import('jspdf').jsPDF
): void {
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const pageAspect = A4_LANDSCAPE_WIDTH_MM / A4_LANDSCAPE_HEIGHT_MM;
  const canvasAspect = canvasWidth / canvasHeight;

  const pageHorizontally = canvasAspect > pageAspect * 1.15;

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) {
    throw new Error('PDF用キャンバスの初期化に失敗しました。');
  }

  if (pageHorizontally) {
    // 高さを A4 に合わせ、幅方向に分割
    const imageHeightOnPdf = A4_LANDSCAPE_HEIGHT_MM;
    const imageWidthOnPdf = imageHeightOnPdf * canvasAspect;
    const totalPages = Math.ceil(imageWidthOnPdf / A4_LANDSCAPE_WIDTH_MM);
    let widthLeft = imageWidthOnPdf;

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();

      const pageImageWidth = Math.min(A4_LANDSCAPE_WIDTH_MM, widthLeft);
      const imageSrcX = i * A4_LANDSCAPE_WIDTH_MM * (canvasWidth / imageWidthOnPdf);
      const imageSrcWidth = pageImageWidth * (canvasWidth / imageWidthOnPdf);

      tempCanvas.width = Math.max(1, Math.ceil(imageSrcWidth));
      tempCanvas.height = canvasHeight;
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(
        canvas,
        imageSrcX,
        0,
        imageSrcWidth,
        canvasHeight,
        0,
        0,
        imageSrcWidth,
        canvasHeight
      );

      const imgData = tempCanvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(imgData, 'JPEG', 0, 0, pageImageWidth, imageHeightOnPdf, undefined, 'FAST');
      widthLeft -= A4_LANDSCAPE_WIDTH_MM;
    }
    return;
  }

  // 幅を A4 に合わせ、高さ方向に分割
  const imageWidthOnPdf = A4_LANDSCAPE_WIDTH_MM;
  const imageHeightOnPdf = imageWidthOnPdf / canvasAspect;
  const totalPages = Math.ceil(imageHeightOnPdf / A4_LANDSCAPE_HEIGHT_MM);
  let heightLeft = imageHeightOnPdf;

  for (let i = 0; i < totalPages; i++) {
    if (i > 0) pdf.addPage();

    const pageImageHeight = Math.min(A4_LANDSCAPE_HEIGHT_MM, heightLeft);
    const imageSrcY = i * A4_LANDSCAPE_HEIGHT_MM * (canvasHeight / imageHeightOnPdf);
    const imageSrcHeight = pageImageHeight * (canvasHeight / imageHeightOnPdf);

    tempCanvas.width = canvasWidth;
    tempCanvas.height = Math.max(1, Math.ceil(imageSrcHeight));
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(
      canvas,
      0,
      imageSrcY,
      canvasWidth,
      imageSrcHeight,
      0,
      0,
      canvasWidth,
      imageSrcHeight
    );

    const imgData = tempCanvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(imgData, 'JPEG', 0, 0, imageWidthOnPdf, pageImageHeight, undefined, 'FAST');
    heightLeft -= A4_LANDSCAPE_HEIGHT_MM;
  }
}

export async function exportPdf(elementId: string): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('PDFエクスポート対象の年表要素が見つかりません。');
    }

    element.classList.add('pdf-export');

    const timelineContainer = element.querySelector('.timeline-container');
    if (timelineContainer) {
      timelineContainer.scrollTop = 0;
      timelineContainer.scrollLeft = 0;
    }

    const scale = computeSafeScale(element.scrollWidth, element.scrollHeight, 3);

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      ignoreElements: (el) => el.classList.contains('pdf-export-ignore'),
    });

    element.classList.remove('pdf-export');

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    buildPdfPages(canvas, pdf);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    pdf.save(`timeline-export-${timestamp}.pdf`);
  } catch (error) {
    const element = document.getElementById(elementId);
    element?.classList.remove('pdf-export');

    if (error instanceof Error) {
      throw new Error(`PDFのエクスポートに失敗しました: ${error.message}`);
    }
    throw new Error('PDFのエクスポートに失敗しました。');
  }
}
