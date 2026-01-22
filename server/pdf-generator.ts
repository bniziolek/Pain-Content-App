// Re-export from infrastructure for backwards compatibility
// All PDF functionality is now in server/infrastructure/pdf/
export {
  generatePDF,
  generateFilename,
  type PDFGenerationConfig,
} from './infrastructure/pdf/pdf-generator';
