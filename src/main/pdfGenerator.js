const PDFDocument = require('pdfkit');
const fs = require('fs');
const { dialog } = require('electron');
const path = require('path');

export async function generatePdf(bookingData) {
  try {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Save Invoice',
      defaultPath: `Invoice_${bookingData.billNo}.pdf`,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (!filePath) return { success: false, message: 'Save location not selected' };

    // Create PDF with better defaults
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
      autoFirstPage: true,
      info: {
        Title: `Invoice - ${bookingData.billNo}`,
        Author: bookingData.hotelDetails.name,
      }
    });

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Register custom font if available
    try {
      doc.registerFont('CustomFont', path.join(__dirname, '../assets/fonts/Arial.ttf'));
    } catch (error) {
      console.log('Using default font, custom font not found:', error);
    }

    // Add header to all pages
    doc.on('pageAdded', () => {
      addHeader(doc, bookingData.hotelDetails);
      addFooter(doc, bookingData.hotelDetails.name);
    });

    // Generate invoice content
    await generateInvoiceContent(doc, bookingData);

    // Handle document attachments
    if (bookingData.guestDetails.uploads?.length > 0 || 
        bookingData.guestDetails.dependants?.some(d => d.uploads?.length > 0)) {
      doc.addPage();
      doc.fontSize(16).font('Helvetica-Bold')
         .text('Attached Documents', { align: 'center' });
      await appendDocuments(doc, bookingData);
    }

    // Finalize the PDF
    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve({ success: true, filePath }));
      writeStream.on('error', reject);
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, message: error.message };
  }
}

function addHeader(doc, hotelDetails) {
  const startY = doc.page.margins.top;
  
  doc.fontSize(20).font('Helvetica-Bold')
     .text(hotelDetails.name, { align: 'center' });

  doc.fontSize(10).font('Helvetica')
     .text(hotelDetails.address, { align: 'center' })
     .text(`Phone: ${hotelDetails.phone}`, { align: 'center' })
     .text(`GSTIN: ${hotelDetails.gstin}`, { align: 'center' });

  doc.moveDown();
  doc.moveTo(doc.page.margins.left, doc.y)
     .lineTo(doc.page.width - doc.page.margins.right, doc.y)
     .stroke();

  doc.y = startY + 120; // Fixed position after header
}

function addFooter(doc, hotelName) {
  const pageNumber = doc.bufferedPageRange().count;
  doc.fontSize(8)
     .text(
       `${hotelName} - Page ${pageNumber}`,
       doc.page.margins.left,
       doc.page.height - 30,
       { align: 'center' }
     );
}

async function generateInvoiceContent(doc, bookingData) {
  // Invoice info box
  generateInvoiceInfoBox(doc, bookingData);
  doc.moveDown();

  // Guest info
  generateGuestInfoBox(doc, bookingData);
  doc.moveDown();

  // Charges table
  generateChargesTable(doc, bookingData);

  // If there are dependants, add their details
  if (bookingData.guestDetails.dependants?.length > 0) {
    doc.addPage();
    generateDependantDetails(doc, bookingData);
  }
}

function generateInvoiceInfoBox(doc, bookingData) {
  const box = doc.rect(
    doc.page.margins.left,
    doc.y,
    doc.page.width - doc.page.margins.left - doc.page.margins.right,
    80
  ).stroke();

  doc.fontSize(14).font('Helvetica-Bold')
     .text('TAX INVOICE', doc.page.margins.left + 10, doc.y - 70);

  const leftCol = doc.page.margins.left + 10;
  const rightCol = doc.page.width - doc.page.margins.right - 200;

  doc.fontSize(10).font('Helvetica')
     .text(`Bill No: ${bookingData.billNo}`, leftCol, doc.y - 45)
     .text(`Date: ${new Date(bookingData.checkoutTimestamp).toLocaleDateString()}`, leftCol, doc.y - 25)
     .text(`Check In: ${new Date(bookingData.stayDetails.checkin).toLocaleString()}`, rightCol, doc.y - 45)
     .text(`Check Out: ${new Date(bookingData.stayDetails.checkout).toLocaleString()}`, rightCol, doc.y - 25);
}

// Additional functions will continue in the next parts...
// ... continuing from previous part

function generateChargesTable(doc, bookingData) {
  const { charges, roomDetails, services, stayDetails } = bookingData;
  
  // Table headers
  const headers = ['Description', 'Details', 'Amount'];
  const tableTop = doc.y + 20;
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidths = [tableWidth * 0.4, tableWidth * 0.35, tableWidth * 0.25];

  // Draw header row
  doc.font('Helvetica-Bold').fontSize(10);
  drawTableRow(doc, headers, tableTop, colWidths, true);
  
  let currentY = tableTop + 25;
  doc.font('Helvetica').fontSize(10);

  // Room charges
  const rows = [
    [
      'Room Charges',
      `${stayDetails.fullDays} days @ ₹${roomDetails.baseRate}/day`,
      `₹${charges.roomCharges.toFixed(2)}`
    ]
  ];

  // Add services if any
  if (services?.length > 0) {
    services.forEach(service => {
      rows.push([
        service.name,
        `${service.units} x ₹${service.cost}`,
        `₹${(service.units * service.cost).toFixed(2)}`
      ]);
    });
  }

  // Add GST
  rows.push(
    ['CGST', `${roomDetails.gstPercentage / 2}%`, `₹${charges.gstBreakdown.cgst.toFixed(2)}`],
    ['SGST', `${roomDetails.gstPercentage / 2}%`, `₹${charges.gstBreakdown.sgst.toFixed(2)}`]
  );

  // Draw all rows
  rows.forEach((row, i) => {
    if (currentY + 30 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top + 20;
      drawTableRow(doc, headers, currentY, colWidths, true);
      currentY += 25;
    }
    drawTableRow(doc, row, currentY, colWidths);
    currentY += 20;
  });

  // Draw total
  doc.font('Helvetica-Bold');
  currentY += 5;
  drawTableRow(doc, 
    ['Total Amount', '', `₹${charges.totalAmount.toFixed(2)}`],
    currentY,
    colWidths,
    true
  );
}

function drawTableRow(doc, columns, y, colWidths, isHeader = false) {
  let x = doc.page.margins.left;

  // Draw background for header
  if (isHeader) {
    doc.fillColor('#f3f4f6')
       .rect(x, y, sum(colWidths), 20)
       .fill();
    doc.fillColor('#000000');
  }

  // Draw cell borders and text
  columns.forEach((text, i) => {
    doc.rect(x, y, colWidths[i], 20).stroke();
    doc.text(
      text,
      x + 5,
      y + 5,
      {
        width: colWidths[i] - 10,
        align: i === columns.length - 1 ? 'right' : 'left'
      }
    );
    x += colWidths[i];
  });
}

async function appendDocuments(doc, bookingData) {
  const allFiles = [
    ...(bookingData.guestDetails.uploads || []),
    ...(bookingData.guestDetails.dependants || [])
      .flatMap(dep => dep.uploads || [])
  ];

  let currentY = doc.y + 20;
  const maxHeight = 300;
  const margin = 50;

  for (const filePath of allFiles) {
    try {
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        continue;
      }

      // Check if we need a new page
      if (currentY + maxHeight > doc.page.height - margin) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }

      const stats = fs.statSync(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      // Skip large files to prevent memory issues
      if (fileSizeInMB > 5) {
        console.warn(`File too large (${fileSizeInMB.toFixed(2)}MB): ${filePath}`);
        continue;
      }

      const ext = path.extname(filePath).toLowerCase();
      
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        doc.image(filePath, {
          fit: [500, maxHeight],
          align: 'center',
          y: currentY
        });
        currentY += maxHeight + margin;
      }
      
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }
}

function sum(array) {
  return array.reduce((a, b) => a + b, 0);
}

