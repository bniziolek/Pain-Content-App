/**
 * Architecture: Infrastructure layer. Wraps external services (email, Stripe, CMS, audit) behind stable interfaces.
 */

export {
  generatePDF,
  generateFilename,
  type PDFGenerationConfig,
} from './pdf-generator';
