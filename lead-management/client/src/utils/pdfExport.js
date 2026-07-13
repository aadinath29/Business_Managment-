import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

/**
 * Exports a DOM element to a multi-page A4 PDF.
 * @param {HTMLElement} element - The DOM element to capture.
 * @param {string} filename - The name of the output PDF file.
 */
export const exportToPDF = async (element, filename) => {
  if (!element) return;

  try {
    // A4 dimensions in mm
    const A4_WIDTH = 210;
    const A4_HEIGHT = 297;

    // Use a high scale for better quality text
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Calculate dimensions
    const imgWidth = A4_WIDTH;
    const pageHeight = A4_HEIGHT;
    
    // Original canvas dimensions
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    let pageCount = 0;

    // Add first page
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    pageCount++;

    // Add subsequent pages if the content is taller than one A4 page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      pageCount++;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};
