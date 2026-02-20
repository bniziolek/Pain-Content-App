import { PublicLayout } from "@/components/public-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight, User } from "lucide-react";
import { Link } from "wouter";

const STUB_BLOG_POSTS = [
  {
    id: "1",
    slug: "understanding-pain-neuroscience",
    title: "Understanding Pain Neuroscience: A Clinician's Guide",
    excerpt:
      "Explore how modern pain neuroscience education can transform your patient outcomes and help them understand why they hurt.",
    category: "Pain Science",
    author: "Dr. Sarah Mitchell",
    publishedAt: "2025-01-15",
    readTime: "8 min read",
    featured: true,
  },
  {
    id: "2",
    slug: "biopsychosocial-approach",
    title: "The Biopsychosocial Approach: Moving Beyond the Biomedical Model",
    excerpt:
      "Learn how integrating psychological and social factors into your treatment can lead to better patient outcomes.",
    category: "Clinical Practice",
    author: "Dr. James Chen",
    publishedAt: "2025-01-10",
    readTime: "6 min read",
    featured: true,
  },
  {
    id: "3",
    slug: "patient-education-strategies",
    title: "5 Patient Education Strategies That Actually Work",
    excerpt:
      "Evidence-based approaches to help your patients understand their condition and become active participants in their recovery.",
    category: "Patient Education",
    author: "Emily Rodriguez, PT",
    publishedAt: "2025-01-05",
    readTime: "5 min read",
    featured: false,
  },
  {
    id: "4",
    slug: "fear-avoidance-beliefs",
    title: "Addressing Fear-Avoidance Beliefs in Chronic Pain",
    excerpt:
      "Practical techniques for helping patients overcome fear-avoidance behaviors and return to meaningful activities.",
    category: "Pain Science",
    author: "Dr. Michael Park",
    publishedAt: "2024-12-28",
    readTime: "7 min read",
    featured: false,
  },
  {
    id: "5",
    slug: "central-sensitization",
    title: "Central Sensitization: What Every Clinician Should Know",
    excerpt:
      "A deep dive into central sensitization and its implications for treating persistent pain conditions.",
    category: "Pain Science",
    author: "Dr. Sarah Mitchell",
    publishedAt: "2024-12-20",
    readTime: "10 min read",
    featured: false,
  },
  {
    id: "6",
    slug: "therapeutic-alliance",
    title: "Building Therapeutic Alliance in Physical Therapy",
    excerpt:
      "The research behind therapeutic relationships and how they impact treatment outcomes.",
    category: "Clinical Practice",
    author: "Amanda Foster, DPT",
    publishedAt: "2024-12-15",
    readTime: "6 min read",
    featured: false,
  },
];

const categories = ["All", "Pain Science", "Clinical Practice", "Patient Education"];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogPage() {
  const featuredPosts = STUB_BLOG_POSTS.filter((p) => p.featured);
  const recentPosts = STUB_BLOG_POSTS.filter((p) => !p.featured);

  return (
    <PublicLayout>
      <div className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4" data-testid="heading-blog">
              Insights & Resources
            </h1>
            <p className="text-xl text-muted-foreground" data-testid="text-blog-description">
              Thought-provoking articles on pain science, patient education, and modern clinical
              practice.
            </p>
          </div>

          <div className="flex gap-3 mb-12 flex-wrap" data-testid="blog-categories">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={category === "All" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                data-testid={`category-${category.toLowerCase().replace(" ", "-")}`}
              >
                {category}
              </Badge>
            ))}
          </div>

          {featuredPosts.length > 0 && (
            <section className="mb-16" data-testid="section-featured">
              <h2 className="text-2xl font-serif font-bold mb-6" data-testid="heading-featured">Featured Articles</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {featuredPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="group hover:shadow-lg transition-all cursor-pointer"
                    data-testid={`blog-post-featured-${post.id}`}
                  >
                    <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/30 rounded-t-lg" />
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" data-testid={`badge-category-${post.id}`}>{post.category}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors" data-testid={`title-post-${post.id}`}>
                        {post.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span data-testid={`author-post-${post.id}`}>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span data-testid={`date-post-${post.id}`}>{formatDate(post.publishedAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section data-testid="section-recent">
            <h2 className="text-2xl font-serif font-bold mb-6" data-testid="heading-recent">Recent Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {recentPosts.map((post, index) => (
                <Card
                  key={post.id}
                  className="group hover:shadow-md transition-all cursor-pointer"
                  data-testid={`blog-post-recent-${post.id}`}
                >
                  <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 rounded-t-lg" />
                  <CardHeader className="pb-2">
                    <Badge variant="outline" className="w-fit mb-2" data-testid={`badge-recent-${post.id}`}>
                      {post.category}
                    </Badge>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2" data-testid={`title-recent-${post.id}`}>
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span data-testid={`author-recent-${post.id}`}>{post.author}</span>
                      <span data-testid={`date-recent-${post.id}`}>{formatDate(post.publishedAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-4">
              Want to contribute? We're always looking for clinical insights.
            </p>
            <Link href="/auth?signup=true">
              <span className="text-primary font-medium hover:underline cursor-pointer inline-flex items-center gap-1" data-testid="link-join-community">
                Join our community <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
