import puppeteer from 'puppeteer';
import { marked } from 'marked';
import type { ContentItem } from '@shared/schema';

export interface PDFGenerationConfig {
  pageSize: 'letter' | 'a4';
  orientation: 'portrait' | 'landscape';
  margins: { top: string; right: string; bottom: string; left: string };
  includeTableOfContents: boolean;
  coverPageMessage?: string;
  clinicianName?: string;
  patientName?: string;
}

const defaultConfig: PDFGenerationConfig = {
  pageSize: 'letter',
  orientation: 'portrait',
  margins: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' },
  includeTableOfContents: false,
};

function generateTableOfContents(items: ContentItem[]): string {
  if (items.length === 0) return '';
  
  const tocItems = items.map((item, index) => 
    `<li><a href="#content-${index}" class="toc-link">${item.title}</a></li>`
  ).join('\n');
  
  return `
    <div class="table-of-contents">
      <h2>Table of Contents</h2>
      <ol>
        ${tocItems}
      </ol>
    </div>
    <div class="page-break"></div>
  `;
}

function generateCoverPage(config: PDFGenerationConfig, itemCount: number): string {
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `
    <div class="cover-page">
      <div class="cover-content">
        <div class="logo">
          <h1>DriverPath</h1>
          <p class="tagline">Evidence-Based Patient Education</p>
        </div>
        
        <div class="cover-details">
          ${config.patientName ? `<p class="patient-name">Prepared for: <strong>${config.patientName}</strong></p>` : ''}
          ${config.clinicianName ? `<p class="clinician-name">From: ${config.clinicianName}</p>` : ''}
          <p class="date">Date: ${date}</p>
          <p class="item-count">${itemCount} educational resource${itemCount !== 1 ? 's' : ''} included</p>
        </div>
        
        ${config.coverPageMessage ? `
          <div class="cover-message">
            <h3>Note from your provider:</h3>
            <p>${config.coverPageMessage}</p>
          </div>
        ` : ''}
      </div>
    </div>
    <div class="page-break"></div>
  `;
}

function generateContentSection(item: ContentItem, index: number): string {
  const bodyHtml = marked(item.body || '');
  
  return `
    <article id="content-${index}" class="content-item">
      <header class="content-header">
        <h2 class="content-title">${item.title}</h2>
        ${item.readTime ? `<span class="read-time">${item.readTime} read</span>` : ''}
      </header>
      
      ${item.imageUrl ? `
        <div class="content-image">
          <img src="${item.imageUrl}" alt="${item.title}" />
        </div>
      ` : ''}
      
      <div class="content-summary">
        <p>${item.summary}</p>
      </div>
      
      <div class="content-body">
        ${bodyHtml}
      </div>
      
      ${item.tags && item.tags.length > 0 ? `
        <div class="content-tags">
          ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      ` : ''}
    </article>
    ${index < -1 ? '<div class="page-break"></div>' : ''}
  `;
}

function generateHTML(items: ContentItem[], config: PDFGenerationConfig): string {
  const contentSections = items.map((item, index) => 
    generateContentSection(item, index)
  ).join('\n<div class="page-break"></div>\n');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Patient Education Packet</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      font-size: 11pt;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
      padding: 2rem;
    }
    
    .cover-content {
      max-width: 600px;
    }
    
    .logo h1 {
      font-size: 2.5rem;
      color: #0F766E;
      margin-bottom: 0.25rem;
    }
    
    .tagline {
      color: #666;
      font-size: 1rem;
      margin-bottom: 3rem;
    }
    
    .cover-details {
      margin-bottom: 2rem;
    }
    
    .cover-details p {
      margin: 0.5rem 0;
      font-size: 1rem;
    }
    
    .patient-name {
      font-size: 1.25rem !important;
      margin-bottom: 1rem !important;
    }
    
    .cover-message {
      background: #f5f5f5;
      padding: 1.5rem;
      border-radius: 8px;
      text-align: left;
      margin-top: 2rem;
    }
    
    .cover-message h3 {
      color: #0F766E;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }
    
    /* Table of Contents */
    .table-of-contents {
      padding: 2rem 0;
    }
    
    .table-of-contents h2 {
      color: #0F766E;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
    }
    
    .table-of-contents ol {
      list-style-position: inside;
      padding-left: 0;
    }
    
    .table-of-contents li {
      margin: 0.75rem 0;
      font-size: 1rem;
    }
    
    .toc-link {
      color: #0F766E;
      text-decoration: none;
    }
    
    .toc-link:hover {
      text-decoration: underline;
    }
    
    /* Content Items */
    .content-item {
      padding: 1rem 0;
    }
    
    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1rem;
      border-bottom: 2px solid #0F766E;
      padding-bottom: 0.5rem;
    }
    
    .content-title {
      color: #0F766E;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .read-time {
      color: #666;
      font-size: 0.875rem;
    }
    
    .content-image {
      margin: 1rem 0;
    }
    
    .content-image img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }
    
    .content-summary {
      font-size: 1.1rem;
      color: #333;
      margin-bottom: 1rem;
      font-style: italic;
      background: #f9f9f9;
      padding: 1rem;
      border-left: 4px solid #0F766E;
    }
    
    .content-body {
      margin: 1.5rem 0;
    }
    
    .content-body h1, .content-body h2, .content-body h3 {
      color: #0F766E;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    
    .content-body h1 { font-size: 1.375rem; }
    .content-body h2 { font-size: 1.25rem; }
    .content-body h3 { font-size: 1.125rem; }
    
    .content-body p {
      margin: 0.75rem 0;
    }
    
    .content-body ul, .content-body ol {
      margin: 0.75rem 0;
      padding-left: 1.5rem;
    }
    
    .content-body li {
      margin: 0.25rem 0;
    }
    
    .content-body a {
      color: #0F766E;
      text-decoration: underline;
    }
    
    .content-body blockquote {
      border-left: 4px solid #F59E0B;
      padding-left: 1rem;
      margin: 1rem 0;
      color: #555;
      font-style: italic;
    }
    
    .content-body code {
      background: #f5f5f5;
      padding: 0.125rem 0.25rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.9em;
    }
    
    .content-body pre {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
    }
    
    .content-body pre code {
      background: none;
      padding: 0;
    }
    
    .content-tags {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e5e5;
    }
    
    .tag {
      display: inline-block;
      background: #e5f4f3;
      color: #0F766E;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
    }
    
    /* Footer */
    @page {
      margin: ${config.margins.top} ${config.margins.right} ${config.margins.bottom} ${config.margins.left};
    }
    
    /* Print styles */
    @media print {
      .page-break {
        page-break-after: always;
      }
      
      a {
        color: #0F766E !important;
      }
    }
  </style>
</head>
<body>
  ${generateCoverPage(config, items.length)}
  ${config.includeTableOfContents ? generateTableOfContents(items) : ''}
  ${contentSections}
</body>
</html>
  `;
}

export async function generatePDF(
  items: ContentItem[],
  config: Partial<PDFGenerationConfig> = {}
): Promise<Buffer> {
  const finalConfig: PDFGenerationConfig = { ...defaultConfig, ...config };
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    const html = generateHTML(items, finalConfig);
    
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    const pdfBuffer = await page.pdf({
      format: finalConfig.pageSize === 'letter' ? 'Letter' : 'A4',
      landscape: finalConfig.orientation === 'landscape',
      printBackground: true,
      margin: finalConfig.margins,
      displayHeaderFooter: false,
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export function generateFilename(patientName?: string): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const sanitizedName = patientName 
    ? patientName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    : 'patient';
  return `driverpath-${sanitizedName}-${timestamp}.pdf`;
}
