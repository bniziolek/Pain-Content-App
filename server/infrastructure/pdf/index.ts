/**
 * Architecture: Infrastructure layer. Wraps external services (email, Stripe, CMS, audit) behind stable interfaces.
 */

export {
  generatePDF,
  generateFilename,
  type PDFGenerationConfig,
  type PDFBrandingConfig,
} from './pdf-generator';

export {
  generateQRCodeDataUrl,
  buildLookupUrl,
  type QRCodeOptions,
} from './qr-code';
