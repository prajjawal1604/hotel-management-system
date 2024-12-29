const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Function to convert image to Base64
function getImageAsBase64(imagePath) {
  const fileData = fs.readFileSync(imagePath);
  return `data:image/jpeg;base64,${fileData.toString('base64')}`;
}

async function generatePDF(htmlContent, imagePath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Convert image to Base64 and embed it in the HTML
  const base64Image = getImageAsBase64(imagePath);
  const additionalContent = `
    <div class="page-break"></div>
    <div class="content">
      <h1>Attached Image</h1>
      <img src="${base64Image}" style="max-width: 100%; height: auto; margin-bottom: 20px;" />
    </div>
  `;

  // Combine the HTML content and additional content
  const finalContent = htmlContent + additionalContent;

  // Load the final HTML content
  await page.setContent(finalContent);

  // Generate the PDF
  await page.pdf({
    path: 'output_with_image.pdf',
    format: 'A4',
    printBackground: true,
  });

  console.log('PDF with the image generated successfully!');
  await browser.close();
}

// Example HTML content
const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
      .page-break { page-break-before: always; }
      .content { padding: 20px; text-align: center; margin: auto; }
      img { display: block; margin: 0 auto; }
    </style>
  </head>
  <body>
    <div class="content">
      <h1>Page 1</h1>
      <p>This is the content of the first page.</p>
    </div>
    
    <div class="page-break"></div>
    
    <div class="content">
      <h1>Page 2</h1>
      <p>This is the content of the second page.</p>
    </div>
  </body>
  </html>
`;

// Use the absolute file path to the image
const imagePath = '/Users/prajjawalpandit/Desktop/Personal-git/hotel-management-system/floor plan.jpeg'; // Replace with your absolute path

// Generate the PDF
generatePDF(htmlContent, imagePath).catch(console.error);
