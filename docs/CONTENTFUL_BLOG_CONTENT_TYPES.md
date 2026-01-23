# Contentful Blog Content Types

This document defines the recommended Contentful content model for the public blog.

## Content Type: Blog Post (`blogPost`)

### Fields

| Field ID | Field Name | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | Title | Short text | Yes | Article headline |
| `slug` | Slug | Short text | Yes | Unique, URL-safe slug |
| `excerpt` | Excerpt | Long text | Yes | 150-200 character summary |
| `body` | Body | Rich text | Yes | Full article content |
| `featuredImage` | Featured Image | Media | No | Hero image for article |
| `category` | Category | Reference | No | Link to `blogCategory` |
| `author` | Author | Reference | No | Link to `blogAuthor` |
| `publishedAt` | Published At | Date | No | Defaults to entry creation date |
| `featured` | Featured | Boolean | No | Show in featured section |
| `readTimeMinutes` | Read Time Minutes | Number | No | Used to display "x min read" |
| `tags` | Tags | Short text (list) | No | Optional filtering and SEO |
| `seoTitle` | SEO Title | Short text | No | Overrides page `<title>` |
| `seoDescription` | SEO Description | Long text | No | Meta description for search |
| `ogImage` | OG Image | Media | No | Social share image |
| `canonicalUrl` | Canonical URL | Short text | No | Preferred URL for SEO |
| `noIndex` | No Index | Boolean | No | Prevent indexing |

### SEO Field Usage

- `seoTitle`: Page `<title>` override to improve search relevance.
- `seoDescription`: Meta description for search results and share previews.
- `ogImage`: Open Graph/Twitter Card image for social sharing.
- `canonicalUrl`: Canonical link tag to avoid duplicate content issues.
- `noIndex`: Meta robots flag (`noindex`) for pages you do not want indexed.

### Validations (Recommended)

- `slug` should be unique and match `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`.
- `readTimeMinutes` should be >= 1.
- `excerpt` length target: 150-200 characters.

## Content Type: Blog Author (`blogAuthor`)

### Fields

| Field ID | Field Name | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `name` | Name | Short text | Yes | Display name |
| `title` | Title | Short text | No | Credentials or role |
| `bio` | Bio | Long text | No | Short author bio |
| `avatar` | Avatar | Media | No | Headshot image |

### Notes

- Rendered author label can be "Name, Title" when both are present.
- Optional author bios can be used for author pages or tooltips.

## Content Type: Blog Category (`blogCategory`)

### Fields

| Field ID | Field Name | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `name` | Name | Short text | Yes | Display label used in UI |
| `slug` | Slug | Short text | Yes | Unique identifier for category pages |
| `description` | Description | Long text | No | Intro copy for category page |
| `heroImage` | Hero Image | Media | No | Category header image |
| `accentColor` | Accent Color | Short text | No | Hex or token for UI styling |
| `seoTitle` | SEO Title | Short text | No | Overrides page `<title>` |
| `seoDescription` | SEO Description | Long text | No | Meta description for search |
| `ogImage` | OG Image | Media | No | Social share image |
| `order` | Order | Number | No | Sort order for navigation |
| `isActive` | Is Active | Boolean | No | Hide categories without deleting |

### SEO Field Usage

- `seoTitle`: Page `<title>` override for category pages.
- `seoDescription`: Meta description for category pages.
- `ogImage`: Open Graph/Twitter Card image for category shares.

### Validations (Recommended)

- `slug` should be unique and match `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`.
- `accentColor` should match `/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/` if you use hex.
