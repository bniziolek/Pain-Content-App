import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const issueBody = `## Summary
Connect the blog page to Contentful CMS for dynamic content management. This will allow non-technical users to create, edit, and publish blog articles without code changes.

## Current State
- Blog page exists at \`/blog\` with stubbed data (\`STUB_BLOG_POSTS\` array)
- Contentful is already integrated for content library items
- Blog UI includes categories, featured articles, and recent articles sections

## Implementation Steps

### 1. Create Contentful Content Model
Create a new content type in Contentful called "Blog Post" with these fields:

| Field | Type | Description |
|-------|------|-------------|
| \`title\` | Short text | Article title |
| \`slug\` | Short text (unique) | URL-friendly identifier |
| \`excerpt\` | Long text | Short preview text (150-200 chars) |
| \`body\` | Rich text | Full article content |
| \`featuredImage\` | Media | Hero image for the article |
| \`category\` | Short text | Category tag (Pain Science, Clinical Practice, etc.) |
| \`author\` | Reference | Link to Author content type |
| \`publishedAt\` | Date | Publication date |
| \`featured\` | Boolean | Whether to show in featured section |
| \`readTimeMinutes\` | Number | Estimated read time |
| \`tags\` | Short text (list) | SEO and filtering tags |

### 2. Create Author Content Model (Optional)
| Field | Type |
|-------|------|
| \`name\` | Short text |
| \`title\` | Short text |
| \`bio\` | Long text |
| \`avatar\` | Media |

### 3. Backend API
Create new endpoints:

\`\`\`typescript
// GET /api/blog
// Returns list of published blog posts
interface BlogListResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
}

// GET /api/blog/:slug
// Returns single blog post with full content
interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string; // Rich text rendered to HTML
  category: string;
  author: {
    name: string;
    title: string;
    avatar?: string;
  };
  publishedAt: string;
  featured: boolean;
  readTimeMinutes: number;
  featuredImage?: {
    url: string;
    alt: string;
  };
}
\`\`\`

### 4. Contentful Service Updates
Update \`server/infrastructure/cms/contentful.ts\`:

\`\`\`typescript
export async function getBlogPosts(options?: {
  featured?: boolean;
  category?: string;
  limit?: number;
  skip?: number;
}): Promise<BlogPost[]> {
  // Fetch from Contentful with filters
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  // Fetch single post by slug
}

export async function getBlogCategories(): Promise<string[]> {
  // Get unique categories from posts
}
\`\`\`

### 5. Frontend Updates
Update \`client/src/pages/public/blog.tsx\`:
- Replace \`STUB_BLOG_POSTS\` with API fetch using React Query
- Add loading states and error handling
- Implement category filtering
- Add pagination if needed

Create \`client/src/pages/public/blog-post.tsx\`:
- Individual blog post page
- Rich text rendering
- Related articles section
- Social sharing buttons

### 6. Routing
Add new route in \`App.tsx\`:
\`\`\`typescript
<Route path="/blog/:slug" component={BlogPostPage} />
\`\`\`

### 7. SEO
- Add dynamic meta tags for blog posts
- Add Open Graph and Twitter Card tags
- Consider adding structured data (JSON-LD) for articles

## Caching Strategy
- Cache blog list for 5 minutes
- Cache individual posts for 10 minutes
- Implement webhook for cache invalidation on Contentful publish

## Acceptance Criteria
- [ ] Blog posts fetched from Contentful
- [ ] Category filtering works
- [ ] Individual blog post pages render correctly
- [ ] Featured posts display in featured section
- [ ] Fallback to stub data if Contentful fails
- [ ] Rich text content renders properly
- [ ] Images from Contentful display correctly
- [ ] SEO meta tags are dynamic
- [ ] Loading and error states handled

## Files to Modify
- \`server/infrastructure/cms/contentful.ts\` - Add blog fetching
- \`server/routes/\` - Add blog routes
- \`client/src/pages/public/blog.tsx\` - Connect to API
- \`client/src/pages/public/blog-post.tsx\` - Create new page
- \`client/src/App.tsx\` - Add blog post route
`;

async function createIssue() {
  const octokit = await getUncachableGitHubClient();
  
  try {
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);
    
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 20
    });
    
    const repoName = repos.find(r => 
      r.name.toLowerCase().includes('pain') || 
      r.name.toLowerCase().includes('content') ||
      r.name.toLowerCase().includes('driver')
    );
    
    if (!repoName) {
      console.log('Could not find repo automatically.');
      if (repos.length === 0) {
        console.log('No repositories found.');
        return;
      }
    }
    
    const targetRepo = repoName || repos[0];
    console.log(`Creating issue in: ${targetRepo.full_name}`);
    
    const { data: created } = await octokit.issues.create({
      owner: targetRepo.owner.login,
      repo: targetRepo.name,
      title: "[Feature] Connect Blog to Contentful CMS",
      body: issueBody,
      labels: ['enhancement', 'blog', 'contentful', 'frontend', 'backend']
    });
    
    console.log(`\nCreated: #${created.number} - ${created.title}`);
    console.log(`URL: ${created.html_url}`);
    
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

createIssue();
