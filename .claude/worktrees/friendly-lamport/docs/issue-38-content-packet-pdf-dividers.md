# Issue #38: Content Packet PDF - Content Dividers & Section Formatting

## Summary

This feature adds visual separation between content pieces within PDF packets. Each content item should be clearly distinguished with consistent formatting and professional presentation, allowing patients to easily navigate educational materials.

## User Story

> As a patient receiving a content packet, I want to easily identify where one topic ends and another begins so that I can navigate the educational material effectively.

## Current State

The PDF generation system (`server/infrastructure/pdf/pdf-generator.ts`) already generates content packets with:
- Cover pages (with optional custom branding for Pro/Enterprise)
- Content body rendering
- Basic page layout

What's missing:
- Visual dividers between content items
- Configurable section formatting options
- Running headers/footers with page numbers
- Print optimization CSS

## Implementation Plan

### Phase 1: Backend - Section Formatting Configuration

#### Task 1.1: Add Configuration Types
- File: `shared/schema.ts`
- Add `SectionFormattingConfig` interface:
  ```typescript
  interface SectionFormattingConfig {
    dividerStyle: 'full-page' | 'inline-header' | 'minimal';
    showReadTime: boolean;
    showTags: boolean;
    showContentNumber: boolean;
    pageBreakBetweenContent: boolean;
  }
  ```
- Add to PDF generation options

#### Task 1.2: Update PDF Generator
- File: `server/infrastructure/pdf/pdf-generator.ts`
- Add divider page template rendering
- Add inline header template rendering
- Implement configurable section formatting
- Add running headers/footers with page numbers

#### Task 1.3: Add Print Optimization CSS
- Add `@media print` styles for:
  - Page break control
  - Orphan/widow prevention
  - Content divider page breaks

### Phase 2: HTML Templates

#### Task 2.1: Create Divider Page Template
- Full-page divider with:
  - Content number (e.g., "1 of 5")
  - Content title
  - Summary/description
  - Read time
  - Topic tags as badges

#### Task 2.2: Create Inline Header Template
- Compact header with:
  - Horizontal rule
  - Bold section title
  - Metadata bar

#### Task 2.3: Content Body Formatting
- Consistent typography (headings, paragraphs, lists)
- Image handling with captions
- Blockquote styling for key points
- Rich text formatting preservation

### Phase 3: Frontend - Configuration UI

#### Task 3.1: Add Packet Formatting Section
- Location: PDF generation dialog/modal
- Add "Packet Formatting" accordion/section

#### Task 3.2: Divider Style Selector
- Radio buttons or dropdown for:
  - Full Page (recommended)
  - Inline Header
  - Minimal

#### Task 3.3: Formatting Options
- Checkboxes for:
  - Show read time
  - Show tags
  - Show content numbers
  - Page break between content

#### Task 3.4: Preview Toggle (Optional)
- Preview button to see formatting before generating

## Task Checklist

### Backend Tasks
- [ ] Define `SectionFormattingConfig` type in schema
- [ ] Update PDF generator to accept formatting config
- [ ] Create full-page divider HTML template
- [ ] Create inline-header HTML template
- [ ] Implement content numbering (X of Y)
- [ ] Add running header with content/packet title
- [ ] Add running footer with page numbers and clinic name
- [ ] Add print optimization CSS (`@media print`)
- [ ] Handle page break logic between content items

### Frontend Tasks
- [ ] Add "Packet Formatting" section to PDF generation dialog
- [ ] Create divider style selector component
- [ ] Add toggle switches for formatting options
- [ ] Wire up config to API call
- [ ] (Optional) Add preview functionality

### Testing Tasks
- [ ] Test full-page dividers render correctly
- [ ] Test inline headers render correctly
- [ ] Test minimal mode renders correctly
- [ ] Test page numbers are accurate
- [ ] Test with/without branding combinations
- [ ] Test with varying number of content items

## Files to Modify

| File | Changes |
|------|---------|
| `shared/schema.ts` | Add `SectionFormattingConfig` type |
| `server/infrastructure/pdf/pdf-generator.ts` | Add divider templates, running headers/footers |
| `client/src/components/pdf-dialog.tsx` (or similar) | Add formatting configuration UI |
| `server/routes.ts` | Update PDF generation endpoint to accept config |

## Dependencies

- Existing PDF generation infrastructure (Puppeteer-based)
- Existing branding system (Pro/Enterprise)
- Content items with title, summary, tags, readTime

## Labels

`enhancement`, `frontend`, `backend`, `pdf`, `replit-ready`

## Related

- PR #137 (auto-created from this issue)
