import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// A4 landscape dimensions in mm
const A4_LANDSCAPE_WIDTH_MM = 297;
const A4_LANDSCAPE_HEIGHT_MM = 210;

export async function exportPdf(elementId: string): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Timeline element not found for PDF export.');
    }

    // Temporarily modify styles for capture
    element.classList.add('pdf-export');

    // 年代ラベルの表示状態を確認
    const yearLabels = element.querySelectorAll('[data-year-label]');
    console.log('Year labels found:', yearLabels.length);

    // Ensure scroll position is at the top for consistent capture
    const timelineContainer = element.querySelector('.timeline-container');
    if (timelineContainer) {
      timelineContainer.scrollTop = 0;
    }

    console.log('Starting PDF export process...');
    console.log('PDF export class added:', element.classList.contains('pdf-export'));

    // Capture the entire element with its natural dimensions
    const canvas = await html2canvas(element, {
      scale: 3, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: true,
      // 年代ラベルが確実にキャプチャされるようにする
      ignoreElements: (el) => {
        // 不要な要素のみ除外
        return el.classList.contains('pdf-export-ignore');
      },
      // フォントの読み込みを待つ
      onclone: (clonedDoc) => {
        console.log('Cloned document for PDF export');
      }
    });

    console.log(`Canvas created with dimensions: ${canvas.width}x${canvas.height}`);

    // Restore original styles
    element.classList.remove('pdf-export');

    // Create a new PDF in landscape mode
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate the aspect ratio
    const canvasAspectRatio = canvasWidth / canvasHeight;

    // Calculate the height of the image on the PDF page, fitting the width
    const imageWidthOnPdf = A4_LANDSCAPE_WIDTH_MM;
    const imageHeightOnPdf = imageWidthOnPdf / canvasAspectRatio;

    // Calculate how many pages are needed
    const totalPages = Math.ceil(imageHeightOnPdf / A4_LANDSCAPE_HEIGHT_MM);
    console.log(`PDF will have ${totalPages} pages.`);

    let heightLeft = imageHeightOnPdf;

    // Add the image to the PDF, splitting it across pages if necessary
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      // Calculate the position and height of the slice to draw
      const pageImageHeight = Math.min(A4_LANDSCAPE_HEIGHT_MM, heightLeft);
      const imageSrcY = i * A4_LANDSCAPE_HEIGHT_MM * (canvasHeight / imageHeightOnPdf);
      const imageSrcHeight = pageImageHeight * (canvasHeight / imageHeightOnPdf);

      // Create a temporary canvas for the slice
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasWidth;
      tempCanvas.height = imageSrcHeight;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        // Draw the slice from the original canvas to the temporary canvas
        tempCtx.drawImage(canvas, 0, imageSrcY, canvasWidth, imageSrcHeight, 0, 0, canvasWidth, imageSrcHeight);
        const imgData = tempCanvas.toDataURL('image/png', 1.0);

        // Add the image slice to the PDF page
        pdf.addImage(imgData, 'PNG', 0, 0, imageWidthOnPdf, pageImageHeight, undefined, 'SLOW');
      }

      heightLeft -= A4_LANDSCAPE_HEIGHT_MM;
    }

    // Generate filename and save
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `timeline-export-${timestamp}.pdf`;
    pdf.save(filename);

    console.log('PDF export successful.');

  } catch (error) {
    console.error('PDF export failed:', error);
    // Re-throw the error to be caught by the calling hook
    throw new Error('Failed to export PDF. See console for details.');
  }
}