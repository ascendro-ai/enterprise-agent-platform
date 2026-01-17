import ExcelJS from 'exceljs';

// Interface for customer record
export interface CustomerRecord {
  name: string;
  email: string;
  consultationNotes?: string;
  quoteAmount?: number;
  status?: string;
  [key: string]: any; // Allow additional fields
}

// Load Excel template from uploaded file
export const loadTemplate = async (file: File): Promise<ExcelJS.Workbook> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  return workbook;
};

// Create a new Excel workbook from template
export const createWorkbookFromTemplate = async (
  templateFile?: File
): Promise<ExcelJS.Workbook> => {
  if (templateFile) {
    return await loadTemplate(templateFile);
  }

  // Create default workbook structure if no template
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Customers');

  // Add headers
  worksheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Consultation Notes', key: 'consultationNotes', width: 50 },
    { header: 'Quote Amount', key: 'quoteAmount', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Date', key: 'date', width: 15 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  return workbook;
};

// Read customer data from Excel
export const readCustomerData = async (
  workbook: ExcelJS.Workbook,
  customerEmail?: string
): Promise<CustomerRecord | CustomerRecord[]> => {
  const worksheet = workbook.getWorksheet(1) || workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in Excel file');
  }

  const customers: CustomerRecord[] = [];
  const headers: string[] = [];

  // Read headers from first row
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value?.toString() || '';
  });

  // Read data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row

    const customer: CustomerRecord = {
      name: '',
      email: '',
    };

    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber];
      if (header) {
        const value = cell.value;
        if (typeof value === 'string' || typeof value === 'number') {
          customer[header.toLowerCase().replace(/\s+/g, '')] = value;
        }
      }
    });

    // Normalize common field names
    if (customer.email) {
      if (customerEmail && customer.email.toLowerCase() === customerEmail.toLowerCase()) {
        return customer; // Return single customer if email matches
      }
      customers.push(customer);
    }
  });

  return customerEmail ? customers.find(c => c.email?.toLowerCase() === customerEmail.toLowerCase()) || null : customers;
};

// Update customer record in Excel
export const updateCustomerRecord = async (
  workbook: ExcelJS.Workbook,
  customer: CustomerRecord
): Promise<ExcelJS.Workbook> => {
  const worksheet = workbook.getWorksheet(1) || workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in Excel file');
  }

  const headers: string[] = [];
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value?.toString() || '';
  });

  // Find existing row by email
  let foundRow: ExcelJS.Row | null = null;
  let rowNumber = 2; // Start after header

  worksheet.eachRow((row, rn) => {
    if (rn === 1) return;
    const emailCell = row.getCell(headers.findIndex(h => h.toLowerCase().includes('email')) + 1);
    if (emailCell.value?.toString().toLowerCase() === customer.email?.toLowerCase()) {
      foundRow = row;
      rowNumber = rn;
    }
  });

  if (foundRow) {
    // Update existing row
    Object.keys(customer).forEach((key) => {
      const headerIndex = headers.findIndex(
        h => h.toLowerCase().replace(/\s+/g, '') === key.toLowerCase()
      );
      if (headerIndex >= 0) {
        foundRow!.getCell(headerIndex + 1).value = customer[key];
      }
    });
  } else {
    // Add new row
    const newRow = worksheet.addRow([]);
    headers.forEach((header, index) => {
      const key = header.toLowerCase().replace(/\s+/g, '');
      if (customer[key] !== undefined) {
        newRow.getCell(index + 1).value = customer[key];
      }
    });
  }

  return workbook;
};

// Calculate price quote based on consultation notes
export const calculatePriceQuote = async (
  workbook: ExcelJS.Workbook,
  customerEmail: string,
  consultationNotes: string,
  quoteFormula?: string
): Promise<number> => {
  // For demo, we'll use a simple calculation
  // In production, this would use the actual formula from the Excel template

  // Simple heuristic: count keywords and calculate base price
  const basePrice = 100;
  const noteLength = consultationNotes.length;
  const wordCount = consultationNotes.split(/\s+/).length;

  // Simple calculation (can be replaced with actual Excel formula evaluation)
  let quote = basePrice;

  // Add based on consultation complexity
  if (wordCount > 50) quote += 50;
  if (wordCount > 100) quote += 50;
  if (consultationNotes.toLowerCase().includes('custom') || consultationNotes.toLowerCase().includes('special')) {
    quote += 75;
  }
  if (consultationNotes.toLowerCase().includes('rush') || consultationNotes.toLowerCase().includes('urgent')) {
    quote += 100;
  }

  // Update the customer record with the quote
  const customer = await readCustomerData(workbook, customerEmail);
  if (customer && typeof customer === 'object' && 'email' in customer) {
    (customer as CustomerRecord).quoteAmount = quote;
    (customer as CustomerRecord).consultationNotes = consultationNotes;
    await updateCustomerRecord(workbook, customer as CustomerRecord);
  }

  return quote;
};

// Export workbook to blob for download
export const exportWorkbook = async (workbook: ExcelJS.Workbook): Promise<Blob> => {
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

// Export workbook to base64 string
export const exportWorkbookToBase64 = async (workbook: ExcelJS.Workbook): Promise<string> => {
  const buffer = await workbook.xlsx.writeBuffer();
  const base64 = btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  return base64;
};
