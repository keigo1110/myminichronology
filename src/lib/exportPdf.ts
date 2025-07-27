import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_PX = 794; // 96 dpi 換算
const A4_HEIGHT_PX = 1122; // 96 dpi 換算

export async function exportPdf(elementId: string): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Timeline element not found.');
    }

    // 年表をキャンバスに変換
    const canvas = await html2canvas(element, {
      scale: 2, // 高解像度
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#F7F7F7'
    });

    // PDF を作成
    const pdf = new jsPDF('p', 'mm', 'a4');

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // ページ分割を計算
    const pagesX = Math.ceil(canvasWidth / A4_WIDTH_PX);
    const pagesY = Math.ceil(canvasHeight / A4_HEIGHT_PX);

    for (let pageY = 0; pageY < pagesY; pageY++) {
      for (let pageX = 0; pageX < pagesX; pageX++) {
        // 新しいページを追加（最初のページ以外）
        if (pageY > 0 || pageX > 0) {
          pdf.addPage();
        }

        // このページに表示する部分を計算
        const sourceX = pageX * A4_WIDTH_PX;
        const sourceY = pageY * A4_HEIGHT_PX;
        const sourceWidth = Math.min(A4_WIDTH_PX, canvasWidth - sourceX);
        const sourceHeight = Math.min(A4_HEIGHT_PX, canvasHeight - sourceY);

        // キャンバスから該当部分を切り出し
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = sourceWidth;
        tempCanvas.height = sourceHeight;
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
          tempCtx.drawImage(
            canvas,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, sourceWidth, sourceHeight
          );

          // PDF に追加
          const imgData = tempCanvas.toDataURL('image/png');
          pdf.addImage(
            imgData,
            'PNG',
            0,
            0,
            A4_WIDTH_MM,
            A4_HEIGHT_MM,
            undefined,
            'FAST'
          );
        }
      }
    }

    // ファイル名を生成
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') + '-' +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0');

    const filename = `timeline_${timestamp}.pdf`;

    // PDF をダウンロード
    pdf.save(filename);

  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export PDF.');
  }
}