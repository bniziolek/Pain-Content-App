// Re-export from infrastructure for backwards compatibility
// All CMS functionality is now in server/infrastructure/cms/
export {
  ContentfulError,
  getAllContentFromContentful,
  getContentByIdFromContentful,
  isContentfulConfigured,
  getAllPathwaysFromContentful,
  getPathwayByIdFromContentful,
} from './infrastructure/cms/contentful.service';
