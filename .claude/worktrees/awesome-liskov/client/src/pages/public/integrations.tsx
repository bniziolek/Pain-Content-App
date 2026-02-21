import { Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Link2, Database, Mail, CreditCard, FileText, Shield, Zap, Check, Code } from "lucide-react";

export default function IntegrationsPage() {
  const integrationCategories = [
    {
      title: "Electronic Health Records (EHR)",
      description: "Connect DriverPath with your existing practice management systems",
      integrations: [
        {
          name: "Epic",
          status: "coming-soon",
          description: "Integration with Epic EHR systems for seamless patient data flow"
        },
        {
          name: "Cerner",
          status: "coming-soon",
          description: "Connect with Cerner for automated patient enrollment"
        },
        {
          name: "Athenahealth",
          status: "coming-soon",
          description: "Sync patient data and appointments with Athenahealth"
        },
        {
          name: "Custom EHR",
          status: "available",
          description: "API access for custom EHR integrations (Enterprise)"
        }
      ]
    },
    {
      title: "Communication",
      description: "Automated patient communication through multiple channels",
      integrations: [
        {
          name: "Email (Gmail/SMTP)",
          status: "available",
          description: "Send patient education and assessment invitations via email"
        },
        {
          name: "SMS/Text Messaging",
          status: "coming-soon",
          description: "Text message reminders and notifications"
        },
        {
          name: "Resend",
          status: "available",
          description: "Transactional email delivery with high deliverability"
        }
      ]
    },
    {
      title: "Payment & Billing",
      description: "Streamlined subscription and payment management",
      integrations: [
        {
          name: "Stripe",
          status: "available",
          description: "Secure subscription billing and payment processing"
        },
        {
          name: "Invoice Management",
          status: "available",
          description: "Generate and manage invoices for enterprise accounts"
        }
      ]
    },
    {
      title: "Content & Education",
      description: "Expand your educational content library",
      integrations: [
        {
          name: "Contentful CMS",
          status: "available",
          description: "Manage and deliver educational content at scale"
        },
        {
          name: "Custom Content Upload",
          status: "available",
          description: "Upload your own educational materials and videos"
        },
        {
          name: "SurveyJS",
          status: "available",
          description: "Create custom assessments with our assessment builder"
        }
      ]
    }
  ];

  const apiFeatures = [
    {
      icon: Database,
      title: "RESTful API",
      description: "Full-featured REST API for patient data, assessments, and content management"
    },
    {
      icon: Shield,
      title: "OAuth 2.0",
      description: "Secure authentication with industry-standard OAuth 2.0 protocol"
    },
    {
      icon: FileText,
      title: "Webhooks",
      description: "Real-time event notifications for patient activities and assessment completions"
    },
    {
      icon: Zap,
      title: "Rate Limiting",
      description: "Fair usage policies with generous rate limits for production applications"
    }
  ];

  const getStatusBadge = (status: string) => {
    if (status === "available") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800" data-testid="badge-available">
          <Check className="w-3 h-3" />
          Available
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800" data-testid="badge-coming-soon">
        Coming Soon
      </span>
    );
  };

  return (
    <PublicLayout>
      <div className="py-16 bg-gray-50" data-testid="integrations-hero">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4" data-testid="integrations-heading">
            Integrations & API
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="integrations-description">
            Connect DriverPath with your existing tools and workflows for a seamless experience.
          </p>
        </div>
      </div>

      <div className="py-16" data-testid="section-integrations">
        <div className="container mx-auto px-6">
          <div className="space-y-12">
            {integrationCategories.map((category, i) => (
              <div key={i} data-testid={`category-${i}`}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid={`heading-category-${i}`}>
                    {category.title}
                  </h2>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {category.integrations.map((integration, j) => (
                    <Card key={j} data-testid={`card-integration-${i}-${j}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Link2 className="w-5 h-5 text-primary" />
                          </div>
                          {getStatusBadge(integration.status)}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">{integration.name}</h3>
                        <p className="text-sm text-muted-foreground">{integration.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 bg-gray-50" data-testid="section-api">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-xl mb-4">
              <Code className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4" data-testid="heading-api">
              Developer API
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Build custom integrations with our comprehensive API. Available for Enterprise customers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {apiFeatures.map((feature, i) => (
              <div key={i} className="text-center" data-testid={`api-feature-${i}`}>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Card className="inline-block" data-testid="card-api-access">
              <CardContent className="p-8">
                <h3 className="font-bold text-gray-900 mb-2">Need API Access?</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  API access is available on Enterprise plans. Contact our team to discuss your integration needs.
                </p>
                <Link href="/contact">
                  <Button data-testid="button-api-contact">
                    Contact Sales
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="py-16" data-testid="section-security">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4" data-testid="heading-security">
                Enterprise-Grade Security
              </h2>
              <p className="text-muted-foreground">
                All integrations maintain our high security and compliance standards.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Shield,
                  title: "HIPAA Compliant",
                  description: "All data transfers are encrypted and HIPAA compliant with BAA support"
                },
                {
                  icon: Database,
                  title: "Data Encryption",
                  description: "TLS 1.3 in transit, AES-256 at rest for all integration data"
                },
                {
                  icon: FileText,
                  title: "Audit Logging",
                  description: "Complete audit trails for all API calls and data access"
                }
              ].map((item, i) => (
                <Card key={i} data-testid={`card-security-${i}`}>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-primary" data-testid="section-cta">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-4" data-testid="heading-cta">
            Ready to Integrate?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Get started with DriverPath and connect your existing tools for a seamless workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?signup=true">
              <Button size="lg" variant="secondary" className="h-12 px-8" data-testid="button-cta-trial">
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-12 px-8 border-white text-white hover:bg-white/10" data-testid="button-cta-contact">
                Discuss Enterprise Needs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
