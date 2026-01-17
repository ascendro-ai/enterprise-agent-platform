import jsPDF from 'jspdf';

// Interface for quote data
export interface QuoteData {
  customerName: string;
  customerEmail: string;
  quoteAmount: number;
  consultationNotes?: string;
  items?: Array<{ description: string; quantity: number; price: number }>;
  paymentLink: string;
  date?: string;
}

// Generate PDF quote from template or create new
export const generateQuotePDF = async (
  quoteData: QuoteData,
  templateFile?: File
): Promise<Blob> => {
  const doc = new jsPDF();

  // If template provided, we could overlay content
  // For now, we'll create a new PDF with the quote data
  // In production, you might use pdf-lib to overlay on template

  // Set up PDF content
  doc.setFontSize(20);
  doc.text('Quote', 20, 30);

  // Customer information
  doc.setFontSize(12);
  doc.text(`Customer: ${quoteData.customerName}`, 20, 50);
  doc.text(`Email: ${quoteData.customerEmail}`, 20, 60);
  doc.text(`Date: ${quoteData.date || new Date().toLocaleDateString()}`, 20, 70);

  // Consultation notes if provided
  if (quoteData.consultationNotes) {
    doc.setFontSize(10);
    doc.text('Consultation Notes:', 20, 85);
    const notesLines = doc.splitTextToSize(quoteData.consultationNotes, 170);
    doc.text(notesLines, 20, 95);
  }

  // Quote items
  let yPosition = quoteData.consultationNotes ? 120 : 90;
  if (quoteData.items && quoteData.items.length > 0) {
    doc.setFontSize(12);
    doc.text('Items:', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    quoteData.items.forEach((item) => {
      const line = `${item.description} - Qty: ${item.quantity} - $${item.price.toFixed(2)}`;
      doc.text(line, 20, yPosition);
      yPosition += 7;
    });
  }

  // Total amount
  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: $${quoteData.quoteAmount.toFixed(2)}`, 20, yPosition);

  // Payment link
  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 255);
  doc.textWithLink('Click here to pay', 20, yPosition, { url: quoteData.paymentLink });
  doc.setTextColor(0, 0, 0);

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text('Thank you for your business!', 20, pageHeight - 20);

  // Generate blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
};

// Generate PDF quote and return as base64 string
export const generateQuotePDFBase64 = async (
  quoteData: QuoteData,
  templateFile?: File
): Promise<string> => {
  const blob = await generateQuotePDF(quoteData, templateFile);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Generate PDF quote and return as data URL
export const generateQuotePDFDataURL = async (
  quoteData: QuoteData,
  templateFile?: File
): Promise<string> => {
  const blob = await generateQuotePDF(quoteData, templateFile);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
