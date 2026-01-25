/**
 * Architecture: Infrastructure layer. Wraps external services (email, Stripe, CMS, audit) behind stable interfaces.
 */

import puppeteer from "puppeteer";
import { marked } from "marked";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { PDFDocument } from "pdf-lib";
import type { ContentItem, SectionFormattingConfig } from "@shared/schema";

const execAsync = promisify(exec);

// Security helpers for branding values
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

function validateColor(
  color: string | null | undefined,
  defaultColor: string,
): string {
  if (!color) return defaultColor;
  // Strict hex color validation
  const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
  return hexColorRegex.test(color) ? color : defaultColor;
}

function validateLogoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    // Only allow https URLs to prevent SSRF attacks
    if (parsed.protocol === "https:") {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

function formatReadTimeLabel(readTime?: string | null): string | null {
  if (!readTime) {
    return null;
  }
  const trimmed = readTime.trim();
  if (!trimmed) {
    return null;
  }
  return /read/i.test(trimmed) ? trimmed : `${trimmed} read`;
}

async function getChromiumPath(): Promise<string> {
  try {
    const { stdout } = await execAsync("which chromium");
    return stdout.trim();
  } catch {
    return "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium";
  }
}

// Branding configuration for custom-branded PDFs
export interface PDFBrandingConfig {
  logoUrl?: string | null;
  clinicName?: string | null;
  tagline?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  footerText?: string | null;
  showPoweredBy?: boolean;
  showWatermark?: boolean;
}

export interface PDFGenerationConfig {
  pageSize: "letter" | "a4";
  orientation: "portrait" | "landscape";
  margins: { top: string; right: string; bottom: string; left: string };
  includeTableOfContents: boolean;
  coverPageMessage?: string;
  clinicianName?: string;
  patientName?: string;
  packetTitle?: string;
  branding?: PDFBrandingConfig;
  sectionFormatting?: SectionFormattingConfig;
  accessCode?: string;
  qrCodeDataUrl?: string;
  lookupUrl?: string;
}

const defaultSectionFormatting: SectionFormattingConfig = {
  dividerStyle: "full-page",
  showReadTime: true,
  showTags: true,
  showContentNumber: true,
  pageBreakBetweenContent: true,
};

const defaultConfig: PDFGenerationConfig = {
  pageSize: "letter",
  orientation: "portrait",
  margins: { top: "0.75in", right: "0.75in", bottom: "0.75in", left: "0.75in" },
  includeTableOfContents: false,
};

function generateTableOfContents(items: ContentItem[]): string {
  if (items.length === 0) return "";

  const tocItems = items
    .map(
      (item, index) =>
        `<li><a href="#content-${index}" class="toc-link">${escapeHtml(item.title)}</a></li>`,
    )
    .join("\n");

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

function generateCoverPage(
  config: PDFGenerationConfig,
  itemCount: number,
  includePageBreak: boolean = true,
): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const title = config.packetTitle || "Your Personalized Health Education";
  const branding = config.branding;

  // Sanitize and validate branding values
  const validatedLogoUrl = validateLogoUrl(branding?.logoUrl);
  const clinicName = branding?.clinicName
    ? escapeHtml(branding.clinicName)
    : "DriverPath";
  const tagline = branding?.tagline
    ? escapeHtml(branding.tagline)
    : branding?.clinicName
      ? ""
      : "Evidence-Based Patient Education";

  // Determine logo/header content based on branding
  const logoSection = validatedLogoUrl
    ? `<img src="${validatedLogoUrl}" alt="${clinicName}" class="logo-image" style="max-width: 300px; max-height: 150px;" />
       <h1 style="margin-top: 1rem;">${clinicName}</h1>`
    : `<h1>${clinicName}</h1>`;

  // Determine footer text
  let footerContent = "";
  if (branding?.footerText) {
    footerContent = escapeHtml(branding.footerText);
  } else if (branding?.showPoweredBy !== false) {
    footerContent = branding?.clinicName
      ? "Powered by DriverPath"
      : "Powered by DriverPath";
  }

  return `
    <div class="cover-page">
      <header class="cover-header">
        <div class="logo">
          ${logoSection}
          ${tagline ? `<p class="tagline">${tagline}</p>` : ""}
        </div>
      </header>
      
      <main class="cover-main">
        <h1 class="packet-title">${escapeHtml(title)}</h1>
        
        <div class="cover-details">
          ${config.patientName ? `<p class="patient-name">Prepared for: <strong>${escapeHtml(config.patientName)}</strong></p>` : ""}
          ${config.clinicianName ? `<p class="clinician-name">Curated by: <strong>${escapeHtml(config.clinicianName)}</strong></p>` : ""}
          <p class="date">Generated on: ${date}</p>
          <p class="item-count">${itemCount} educational resource${itemCount !== 1 ? "s" : ""} included</p>
        </div>
        
        ${
          config.accessCode
            ? `
          <div class="access-code-section">
            <h3>Access Digital Content</h3>
            <p class="access-instructions">Scan the QR code or visit <strong>${config.lookupUrl || "driverpath.com/lookup"}</strong> and enter your access code:</p>
            <div class="access-code-content">
              ${config.qrCodeDataUrl ? `<img src="${config.qrCodeDataUrl}" alt="QR Code" class="qr-code" />` : ""}
              <div class="code-display">
                <span class="access-code">${escapeHtml(config.accessCode)}</span>
              </div>
            </div>
            <p class="access-note">Access videos, interactive content, and additional resources from this packet online.</p>
          </div>
        `
            : ""
        }
        
        ${
          config.coverPageMessage
            ? `
          <div class="cover-message">
            <h3>A note from your provider:</h3>
            <p>${escapeHtml(config.coverPageMessage)}</p>
          </div>
        `
            : ""
        }
      </main>
      
      <footer class="cover-footer">
        ${footerContent ? `<p>${footerContent}</p>` : ""}
      </footer>
    </div>
    ${includePageBreak ? '<div class="page-break"></div>' : ""}
  `;
}

function generateDividerPage(
  item: ContentItem,
  index: number,
  total: number,
  formatting: SectionFormattingConfig,
  forcePageBreakBefore: boolean,
): string {
  if (formatting.dividerStyle !== "full-page") {
    return "";
  }

  const readTimeLabel = formatReadTimeLabel(item.readTime);
  const dividerClass = forcePageBreakBefore
    ? "divider-page divider-page--break-before"
    : "divider-page";

  return `
    <section class="${dividerClass}">
      ${
        formatting.showContentNumber
          ? `
        <p class="divider-number">Section ${index + 1} of ${total}</p>
      `
          : ""
      }
      <h2 class="divider-title">${escapeHtml(item.title)}</h2>
      ${item.summary ? `<p class="divider-summary">${escapeHtml(item.summary)}</p>` : ""}
      ${
        formatting.showReadTime && readTimeLabel
          ? `
        <p class="divider-meta">${escapeHtml(readTimeLabel)}</p>
      `
          : ""
      }
      ${
        formatting.showTags && item.tags && item.tags.length > 0
          ? `
        <div class="divider-tags">
          ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      `
          : ""
      }
    </section>
  `;
}

function generateInlineHeader(
  item: ContentItem,
  index: number,
  formatting: SectionFormattingConfig,
): string {
  if (formatting.dividerStyle !== "inline-header") {
    return "";
  }

  return `
    <header class="inline-header">
      <div class="inline-title">
        ${formatting.showContentNumber ? `<span class="content-number">${index + 1}</span>` : ""}
        <h2 class="content-title">${escapeHtml(item.title)}</h2>
      </div>
      <div class="inline-meta">
        ${formatting.showReadTime && item.readTime ? `<span>${escapeHtml(item.readTime)} read</span>` : ""}
        ${
          formatting.showTags && item.tags && item.tags.length > 0
            ? `<span>${item.tags.map((tag) => escapeHtml(tag)).join(" • ")}</span>`
            : ""
        }
      </div>
      <div class="inline-divider"></div>
    </header>
  `;
}

function generateContentSection(
  item: ContentItem,
  index: number,
  total: number,
  formatting: SectionFormattingConfig,
): string {
  const bodyHtml = marked(item.body || "");
  const validatedImageUrl = validateLogoUrl(item.imageUrl);
  const showHeader = formatting.dividerStyle !== "inline-header";
  const showReadTime =
    formatting.dividerStyle !== "full-page" && formatting.showReadTime;
  const showTags =
    formatting.dividerStyle !== "full-page" && formatting.showTags;
  const showContentNumber =
    formatting.dividerStyle !== "full-page" && formatting.showContentNumber;
  const readTimeLabel = formatReadTimeLabel(item.readTime);
  const forceDividerBreakBefore =
    formatting.dividerStyle === "full-page" &&
    !formatting.pageBreakBetweenContent &&
    index > 0;

  return `
    ${generateDividerPage(item, index, total, formatting, forceDividerBreakBefore)}
    <article id="content-${index}" class="content-item">
      ${generateInlineHeader(item, index, formatting)}
      ${
        showHeader
          ? `
        <header class="content-header">
          <div class="content-title-row">
            ${showContentNumber ? `<span class="content-number">${index + 1}</span>` : ""}
            <h2 class="content-title">${escapeHtml(item.title)}</h2>
          </div>
          ${showReadTime && readTimeLabel ? `<span class="read-time">${escapeHtml(readTimeLabel)}</span>` : ""}
        </header>
      `
          : ""
      }
      
      ${
        validatedImageUrl
          ? `
        <div class="content-image">
          <img src="${validatedImageUrl}" alt="${escapeHtml(item.title)}" />
        </div>
      `
          : ""
      }
      
      ${
        item.summary
          ? `
        <div class="content-summary">
          <p>${escapeHtml(item.summary)}</p>
        </div>
      `
          : ""
      }
      
      <div class="content-body">
        ${bodyHtml}
      </div>
      
      ${
        showTags && item.tags && item.tags.length > 0
          ? `
        <div class="content-tags">
          ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      `
          : ""
      }
    </article>
  `;
}

function buildHtml(
  bodyHtml: string,
  config: PDFGenerationConfig,
  formatting: SectionFormattingConfig,
): string {
  // Validate and sanitize branding colors or use defaults
  const branding = config.branding;
  const primaryColor = validateColor(branding?.primaryColor, "#0F766E");
  const secondaryColor = validateColor(branding?.secondaryColor, "#f5f5f5");
  const accentColor = validateColor(branding?.accentColor, "#14B8A6");
  const showWatermark = Boolean(branding) && branding?.showWatermark !== false;
  const watermarkText = branding?.clinicName
    ? escapeHtml(branding.clinicName)
    : "DriverPath";
  const watermarkHtml = showWatermark
    ? `<div class="pdf-watermark">${watermarkText}</div>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Patient Education Packet</title>
  <style>
    :root {
      --primary-color: ${primaryColor};
      --secondary-color: ${secondaryColor};
      --accent-color: ${accentColor};
    }
    
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
      position: relative;
    }

    .pdf-watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-24deg);
      font-size: 72px;
      color: rgba(0, 0, 0, 0.05);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
      z-index: 0;
      pointer-events: none;
    }

    .pdf-content {
      position: relative;
      z-index: 1;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      min-height: 100vh;
      text-align: center;
      padding: 2rem;
    }
    
    .cover-header {
      padding-top: 2rem;
    }
    
    .logo-image {
      max-width: 200px;
      max-height: 80px;
      object-fit: contain;
      margin-bottom: 0.5rem;
    }
    
    .cover-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      max-width: 600px;
    }
    
    .packet-title {
      font-size: 2rem;
      color: var(--primary-color);
      margin-bottom: 2rem;
      font-weight: 600;
    }
    
    .logo h1 {
      font-size: 2.5rem;
      color: var(--primary-color);
      margin-bottom: 0.25rem;
    }
    
    .tagline {
      color: #666;
      font-size: 1rem;
      margin-bottom: 1rem;
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
      background: var(--secondary-color);
      padding: 1.5rem;
      border-radius: 8px;
      text-align: left;
      margin-top: 2rem;
    }
    
    .cover-message h3 {
      color: var(--primary-color);
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .access-code-section {
      background: linear-gradient(135deg, var(--secondary-color), #f8fafc);
      border: 2px solid var(--primary-color);
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 1.5rem;
      text-align: center;
    }

    .access-code-section h3 {
      color: var(--primary-color);
      margin-bottom: 0.75rem;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .access-instructions {
      font-size: 0.875rem;
      margin-bottom: 1rem;
      color: #475569;
    }

    .access-code-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      margin: 1rem 0;
    }

    .qr-code {
      width: 100px;
      height: 100px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .code-display {
      background: white;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      border: 2px dashed var(--primary-color);
    }

    .access-code {
      font-family: "Courier New", monospace;
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--primary-color);
      letter-spacing: 0.1em;
    }

    .access-note {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.75rem;
      font-style: italic;
    }
    
    .cover-footer {
      padding-bottom: 2rem;
    }
    
    .cover-footer p {
      color: #999;
      font-size: 0.875rem;
    }
    
    /* Table of Contents */
    .table-of-contents {
      padding: 2rem 0;
    }
    
    .table-of-contents h2 {
      color: var(--primary-color);
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
      color: var(--accent-color);
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
      border-bottom: 2px solid var(--primary-color);
      padding-bottom: 0.5rem;
    }

    .content-title-row {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
    }

    .content-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      border-radius: 9999px;
      background: var(--secondary-color);
      color: var(--primary-color);
      font-size: 0.875rem;
      font-weight: 600;
    }
    
    .content-title {
      color: var(--primary-color);
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
      background: var(--secondary-color);
      padding: 1rem;
      border-left: 4px solid var(--primary-color);
    }
    
    .content-body {
      margin: 1.5rem 0;
    }
    
    .content-body h1, .content-body h2, .content-body h3 {
      color: var(--primary-color);
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
      color: var(--accent-color);
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
    
    /* Divider Pages */
    .divider-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: 85vh;
      padding: 2rem;
      page-break-after: always;
    }

    .divider-page--break-before {
      page-break-before: always;
    }
    
    .divider-number {
      font-size: 0.875rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 1rem;
    }
    
    .divider-title {
      font-size: 2rem;
      color: var(--primary-color);
      margin-bottom: 1rem;
    }
    
    .divider-summary {
      max-width: 600px;
      color: #444;
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }
    
    .divider-meta {
      color: #666;
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
    }
    
    .divider-tags {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem;
    }
    
    /* Inline Header */
    .inline-header {
      margin-bottom: 1.5rem;
    }
    
    .inline-title {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
    }
    
    .inline-meta {
      margin-top: 0.5rem;
      color: #666;
      font-size: 0.875rem;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    
    .inline-divider {
      margin-top: 0.75rem;
      border-bottom: 2px solid var(--primary-color);
      width: 100%;
    }

    /* Minimal Style Overrides */
    .divider-style-minimal .content-header {
      border-bottom: 1px solid #e5e5e5;
    }

    .divider-style-minimal .content-title {
      font-size: 1.25rem;
    }

    .divider-style-minimal .content-summary {
      font-style: normal;
      background: transparent;
      padding: 0;
      border-left: none;
      color: #444;
    }
    
    .content-tags {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e5e5;
    }
    
    .tag {
      display: inline-block;
      background: var(--secondary-color);
      color: var(--primary-color);
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

      .content-item,
      .content-summary,
      .content-image,
      .content-tags,
      .divider-page {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      p {
        orphans: 3;
        widows: 3;
      }
      
      a {
        color: var(--accent-color) !important;
      }
    }
  </style>
</head>
<body class="divider-style-${formatting.dividerStyle}">
  ${watermarkHtml}
  <div class="pdf-content">
    ${bodyHtml}
  </div>
</body>
</html>
  `;
}

function generateContentHtml(
  items: ContentItem[],
  config: PDFGenerationConfig,
  formatting: SectionFormattingConfig,
): string {
  const contentSections = items
    .map((item, index) => {
      const sectionHtml = generateContentSection(
        item,
        index,
        items.length,
        formatting,
      );
      const shouldBreak =
        formatting.pageBreakBetweenContent && index < items.length - 1;
      return `${sectionHtml}${shouldBreak ? '<div class="page-break"></div>' : ""}`;
    })
    .join("\n");

  const bodyHtml = `
    ${config.includeTableOfContents ? generateTableOfContents(items) : ""}
    ${contentSections}
  `;

  return buildHtml(bodyHtml, config, formatting);
}

function generateCoverHtml(
  config: PDFGenerationConfig,
  itemCount: number,
  formatting: SectionFormattingConfig,
): string {
  const bodyHtml = generateCoverPage(config, itemCount, false);
  return buildHtml(bodyHtml, config, formatting);
}

export async function generatePDF(
  items: ContentItem[],
  config: Partial<PDFGenerationConfig> = {},
): Promise<Buffer> {
  const finalConfig: PDFGenerationConfig = { ...defaultConfig, ...config };
  const formatting: SectionFormattingConfig = {
    ...defaultSectionFormatting,
    ...(finalConfig.sectionFormatting || {}),
  };

  const chromiumPath = await getChromiumPath();
  console.log("Using Chromium at:", chromiumPath);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromiumPath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--single-process",
      "--no-zygote",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-sync",
      "--disable-translate",
      "--metrics-recording-only",
      "--no-first-run",
    ],
  });

  try {
    const page = await browser.newPage();
    const coverHtml = generateCoverHtml(finalConfig, items.length, formatting);
    const contentHtml = generateContentHtml(items, finalConfig, formatting);

    const headerTitle = escapeHtml(
      finalConfig.packetTitle || "Patient Education Packet",
    );
    const footerClinicName = escapeHtml(
      finalConfig.branding?.clinicName || "DriverPath",
    );
    const headerTemplate = `
      <div style="font-size:8px; color:#666; width:100%; padding:0 0.5in; display:flex; justify-content:flex-end;">
        <span>${headerTitle}</span>
      </div>
    `;
    const footerTemplate = `
      <div style="font-size:8px; color:#666; width:100%; padding:0 0.5in; display:flex; justify-content:space-between;">
        <span>${footerClinicName}</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;

    await page.setContent(coverHtml, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    const coverPdfBuffer = await page.pdf({
      format: finalConfig.pageSize === "letter" ? "Letter" : "A4",
      landscape: finalConfig.orientation === "landscape",
      printBackground: true,
      margin: finalConfig.margins,
      displayHeaderFooter: false,
    });

    await page.setContent(contentHtml, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    const contentPdfBuffer = await page.pdf({
      format: finalConfig.pageSize === "letter" ? "Letter" : "A4",
      landscape: finalConfig.orientation === "landscape",
      printBackground: true,
      margin: finalConfig.margins,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
    });

    const mergedPdf = await PDFDocument.create();
    const coverDoc = await PDFDocument.load(coverPdfBuffer);
    const contentDoc = await PDFDocument.load(contentPdfBuffer);
    const coverPages = await mergedPdf.copyPages(
      coverDoc,
      coverDoc.getPageIndices(),
    );
    coverPages.forEach((pageItem) => mergedPdf.addPage(pageItem));
    const contentPages = await mergedPdf.copyPages(
      contentDoc,
      contentDoc.getPageIndices(),
    );
    contentPages.forEach((pageItem) => mergedPdf.addPage(pageItem));
    const mergedBytes = await mergedPdf.save();

    return Buffer.from(mergedBytes);
  } finally {
    await browser.close();
  }
}

export function generateFilename(patientName?: string): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const sanitizedName = patientName
    ? patientName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()
    : "patient";
  return `driverpath-${sanitizedName}-${timestamp}.pdf`;
}
