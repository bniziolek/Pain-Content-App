import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import {
  BookOpen,
  MessageSquare,
  ClipboardList,
  Send,
  Route,
  BarChart3,
  Shield,
  Users,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";

const featureCategories = [
  {
    id: "content",
    label: "Content Library",
    icon: BookOpen,
  },
  {
    id: "assessments",
    label: "Assessments",
    icon: ClipboardList,
  },
  {
    id: "delivery",
    label: "Delivery",
    icon: Send,
  },
  {
    id: "pathways",
    label: "Care Pathways",
    icon: Route,
  },
];

const features = {
  content: {
    title: "Evidence-Based Content Library",
    description:
      "Curated patient education materials focused on pain neuroscience and biopsychosocial approaches.",
    image: "content-library",
    highlights: [
      "200+ curated educational articles and videos",
      "Pain neuroscience education resources",
      "Fear-avoidance reduction content",
      "Condition-specific education packets",
      "Regularly updated with latest research",
      "Search by topic, condition, or keyword",
    ],
    badge: "Core Feature",
  },
  assessments: {
    title: "Automated Patient Assessments",
    description:
      "Screen patients before they walk in the door with customizable assessment tools.",
    image: "assessments",
    highlights: [
      "Pre-visit screening questionnaires",
      "Yellow flag detection",
      "Fear-avoidance beliefs assessment",
      "Custom assessment builder",
      "Automatic scoring and analysis",
      "Results integrated into patient records",
    ],
    badge: "Pro Feature",
  },
  delivery: {
    title: "Seamless Content Delivery",
    description:
      "Send personalized education to patients via email with tracking and engagement metrics.",
    image: "delivery",
    highlights: [
      "One-click email delivery",
      "Personalized content packets",
      "Patient engagement tracking",
      "Open and read receipts",
      "Mobile-optimized content",
      "HIPAA-compliant delivery",
    ],
    badge: "Pro Feature",
  },
  pathways: {
    title: "Care Pathways & Follow-ups",
    description:
      "Create automated education sequences that guide patients through their recovery journey.",
    image: "pathways",
    highlights: [
      "Drag-and-drop pathway builder",
      "Automated follow-up sequences",
      "Time-based content triggers",
      "Condition-specific templates",
      "Patient progress tracking",
      "Customizable messaging",
    ],
    badge: "Pro Feature",
  },
};

const additionalFeatures = [
  {
    icon: MessageSquare,
    title: "Content Concierge",
    description:
      "Not sure what to send? Our AI-powered concierge suggests content based on patient assessments.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track patient engagement, content performance, and practice metrics in one place.",
  },
  {
    icon: Shield,
    title: "HIPAA Compliance",
    description:
      "Enterprise-grade security with audit logging, encryption, and role-based access control.",
  },
  {
    icon: Users,
    title: "Patient Portal",
    description:
      "Give patients a secure place to access their educational materials and complete assessments.",
  },
];

export default function FeaturesPage() {
  return (
    <PublicLayout>
      <section className="py-20 bg-gradient-to-b from-secondary/20 to-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4" data-testid="badge-platform-features">
              Platform Features
            </Badge>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6" data-testid="heading-features">
              Everything You Need for Better Patient Education
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed" data-testid="text-features-description">
              From curated content to automated assessments, DriverPath gives you the tools to
              educate patients effectively and efficiently.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="section-feature-tabs">
        <div className="container mx-auto px-6">
          <Tabs defaultValue="content" className="max-w-5xl mx-auto">
            <TabsList className="grid grid-cols-4 mb-12" data-testid="feature-tabs-list">
              {featureCategories.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="flex items-center gap-2"
                  data-testid={`tab-${cat.id}`}
                >
                  <cat.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(features).map(([key, feature]) => (
              <TabsContent key={key} value={key} data-testid={`tabpanel-${key}`}>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <Badge variant="outline" className="mb-4" data-testid={`badge-${key}`}>
                      {feature.badge}
                    </Badge>
                    <h2 className="text-3xl font-serif font-bold mb-4" data-testid={`title-${key}`}>{feature.title}</h2>
                    <p className="text-muted-foreground text-lg mb-8">{feature.description}</p>
                    <ul className="space-y-3">
                      {feature.highlights.map((highlight, index) => (
                        <li key={highlight} className="flex items-start gap-3" data-testid={`highlight-${key}-${index}`}>
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8">
                      <Link href="/auth?signup=true">
                        <Button className="rounded-full" data-testid={`button-try-${key}`}>
                          Try It Free <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-primary/5 to-secondary/20 rounded-3xl h-80 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary/40" />
                      <p>Feature Preview</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <section className="py-20 bg-gray-50" data-testid="section-additional-features">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4" data-testid="heading-more-features">More Powerful Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything else you need to run a modern, patient-centered practice.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {additionalFeatures.map((feature, index) => (
              <Card key={feature.title} data-testid={`card-additional-${index}`}>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg" data-testid={`title-additional-${index}`}>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="section-cta">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-primary text-white" data-testid="card-cta">
              <CardContent className="p-12 text-center">
                <h2 className="text-3xl font-serif font-bold mb-4" data-testid="heading-cta">
                  See All Features in Action
                </h2>
                <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                  Start your 14-day free trial and explore every feature with no commitment. No
                  credit card required.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth?signup=true">
                    <Button size="lg" variant="secondary" className="rounded-full" data-testid="button-start-trial">
                      Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/subscription">
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full bg-transparent border-white text-white hover:bg-white/10"
                      data-testid="button-view-pricing"
                    >
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
