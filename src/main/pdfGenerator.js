// pdfGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { dialog } = require('electron');

export async function generatePdf(bookingData) {
  try {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Save Invoice',
      defaultPath: `Invoice_${bookingData.billNo}.pdf`,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (!filePath) {
      return { success: false, message: 'Save location not selected' };
    }

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true, // Enable page buffering for footer
    });

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Add footer to all pages
    doc.on('pageAdded', () => addFooter(doc, bookingData.hotelDetails.name));

    // First page - Professional Invoice
    generateInvoicePage(doc, bookingData);

    // Second page - Guest Details
    if (bookingData.guestDetails.dependants?.length > 0) {
      checkPageSpace(doc, 100); // Check for space before adding a new page
      generateGuestDetailsPage(doc, bookingData);
    }

    // Append Documents with proper error handling
    await appendDocuments(doc, bookingData);

    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        resolve({ success: true, filePath });
      });
      writeStream.on('error', reject);
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, message: error.message };
  }
}

function generateInvoicePage(doc, bookingData) {
  doc.fontSize(24).font('Helvetica-Bold').text(bookingData.hotelDetails.name, { align: 'center' });

  doc.fontSize(10)
    .font('Helvetica')
    .text(bookingData.hotelDetails.address, { align: 'center' })
    .text(`Phone: ${bookingData.hotelDetails.phone}`, { align: 'center' })
    .text(`GSTIN: ${bookingData.hotelDetails.gstin}`, { align: 'center' });

  doc.moveTo(40, doc.y + 10).lineTo(doc.page.width - 40, doc.y + 10).stroke();

  doc.moveDown(2);
  generateInvoiceInfoBox(doc, bookingData);

  doc.moveDown();
  generateGuestInfoBox(doc, bookingData);

  doc.moveDown(2);
  generateBillTable(doc, bookingData);
}

function generateInvoiceInfoBox(doc, bookingData) {
  const startY = doc.y;
  const boxHeight = 60;
  const boxWidth = doc.page.width - 80;

  doc.rect(40, startY, boxWidth, boxHeight).stroke();

  doc.fontSize(12).font('Helvetica-Bold').text('TAX INVOICE', 50, startY + 10);
  doc.fontSize(10)
    .font('Helvetica')
    .text(`Bill No: ${bookingData.billNo}`, 50, startY + 30)
    .text(`Date: ${new Date(bookingData.checkoutTimestamp).toLocaleDateString()}`, 50, startY + 45);

  doc.fontSize(10)
    .text(`Check In: ${new Date(bookingData.stayDetails.checkin).toLocaleString()}`, boxWidth - 200, startY + 10)
    .text(`Check Out: ${new Date(bookingData.stayDetails.checkout).toLocaleString()}`, boxWidth - 200, startY + 25);

  doc.y = startY + boxHeight + 10;
}

function generateGuestInfoBox(doc, bookingData) {
  const startY = doc.y;
  const boxHeight = bookingData.guestDetails.company_name ? 120 : 90;
  const boxWidth = doc.page.width - 80;

  doc.rect(40, startY, boxWidth, boxHeight).stroke();

  doc.fontSize(12).font('Helvetica-Bold').text('Guest Details', 50, startY + 10);

  doc.fontSize(10)
    .font('Helvetica')
    .text(`Name: ${bookingData.guestDetails.name}`, 50, startY + 30)
    .text(`Phone: ${bookingData.guestDetails.phone_no}`, 50, startY + 45)
    .text(`Address: ${bookingData.guestDetails.permanent_address}`, 50, startY + 60);

  if (bookingData.guestDetails.company_name) {
    doc.fontSize(10)
      .text(`Company: ${bookingData.guestDetails.company_name}`, 50, startY + 80)
      .text(`GSTIN: ${bookingData.guestDetails.GSTIN || 'N/A'}`, 50, startY + 95);
  }

  doc.y = startY + boxHeight + 10;
}

function generateBillTable(doc, bookingData) {
  const startY = doc.y;
  const { charges, roomDetails, services, stayDetails } = bookingData;

  drawTableRow(doc, startY, ['Description', 'Details', 'Amount'], true);
  let currentY = startY + 25;

  drawTableRow(doc, currentY, [
    'Room Charges',
    `${stayDetails.fullDays} days @ ₹${roomDetails.baseRate}/day`,
    `₹${charges.roomCharges.toFixed(2)}`,
  ]);
  currentY += 20;

  if (services?.length > 0) {
    services.forEach((service) => {
      checkPageSpace(doc, 30); // Check space for each service entry
      drawTableRow(doc, currentY, [
        service.name,
        `${service.units} x ₹${service.cost}`,
        `₹${(service.units * service.cost).toFixed(2)}`,
      ]);
      currentY += 20;
    });
  }

  drawTableRow(doc, currentY, [
    'CGST',
    `${roomDetails.gstPercentage / 2}%`,
    `₹${charges.gstBreakdown.cgst.toFixed(2)}`,
  ]);
  currentY += 20;

  drawTableRow(doc, currentY, [
    'SGST',
    `${roomDetails.gstPercentage / 2}%`,
    `₹${charges.gstBreakdown.sgst.toFixed(2)}`,
  ]);
  currentY += 25;

  doc.font('Helvetica-Bold');
  drawTableRow(doc, currentY, ['Grand Total', '', `₹${charges.totalAmount.toFixed(2)}`], true);
}

function drawTableRow(doc, y, columns, isHeader = false) {
  const width = doc.page.width - 80;
  const colWidths = [width * 0.4, width * 0.35, width * 0.25];
  let x = 40;

  if (isHeader) {
    doc.rect(x, y, width, 20).fill('#f3f4f6');
  }

  doc.fontSize(10).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');

  columns.forEach((text, i) => {
    doc.text(text, x + 5, y + 5, {
      width: colWidths[i] - 10,
      align: i === columns.length - 1 ? 'right' : 'left',
    });
    x += colWidths[i];
  });

  doc.rect(40, y, width, 20).stroke();
}

function generateGuestDetailsPage(doc, bookingData) {
  doc.fontSize(16).font('Helvetica-Bold').text('Additional Guest Details', { align: 'center' });

  doc.moveDown();

  bookingData.guestDetails.dependants.forEach((dep, index) => {
    checkPageSpace(doc, 100);
    const yStart = doc.y;

    doc.rect(40, yStart, doc.page.width - 80, 80).stroke();

    doc.fontSize(12).font('Helvetica-Bold').text(`Guest ${index + 1}`, 50, yStart + 10);

    doc.fontSize(10).font('Helvetica')
      .text(`Name: ${dep.name}`, 50, yStart + 30)
      .text(`Age: ${dep.age}    Gender: ${dep.gender}`, 50, yStart + 45)
      .text(`Aadhar: ${dep.aadhar}`, 50, yStart + 60);

    doc.y = yStart + 90;
  });
}

async function appendDocuments(doc, bookingData) {
  const allFiles = [
    ...(bookingData.guestDetails.uploads || []),
    ...(bookingData.guestDetails.dependants || []).flatMap((dep) => dep.uploads || []),
  ];

  let processedFiles = [];
  let failedFiles = [];

  for (const filePath of allFiles) {
    try {
      if (!fs.existsSync(filePath)) {
        failedFiles.push({ path: filePath, reason: 'File not found' });
        continue;
      }

      checkPageSpace(doc, 300);
      const ext = filePath.toLowerCase().split('.').pop();

      if (['jpg', 'jpeg', 'png'].includes(ext)) {
        doc.image(filePath, { fit: [500, 700], align: 'center', valign: 'center' });
        processedFiles.push(filePath);
      } else if (ext === 'pdf') {
        const pdfBytes = fs.readFileSync(filePath);
        doc.image(pdfBytes, { fit: [500, 700], align: 'center', valign: 'center' });
        processedFiles.push(filePath);
      }
    } catch (error) {
      failedFiles.push({ path: filePath, reason: error.message });
    }
  }

  return { processedFiles, failedFiles };
}

function addFooter(doc, hotelName) {
  const pageNumber = doc.bufferedPageRange().count;
  doc.fontSize(8).text(`${hotelName} - Page ${pageNumber}`, 40, doc.page.height - 30, { align: 'center' });
}

function checkPageSpace(doc, requiredSpace = 50) {
  if (doc.y + requiredSpace > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}