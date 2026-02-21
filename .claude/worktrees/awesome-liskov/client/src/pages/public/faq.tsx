import { useState } from "react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Search, MessageSquare } from "lucide-react";

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const categories = [
    {
      name: "Getting Started",
      faqs: [
        {
          id: "trial",
          question: "How do I start my free trial?",
          answer: "Getting started is easy! Click 'Start Free Trial' on any page, create your account with your email and password, and you'll have immediate access to all features for 14 days. No credit card required."
        },
        {
          id: "setup",
          question: "How long does it take to set up DriverPath?",
          answer: "Most clinicians are up and running within 30 minutes. After creating your account, you can immediately start exploring the content library and sending education to patients. Our quick-start guide walks you through the essentials."
        },
        {
          id: "training",
          question: "Is there training available?",
          answer: "Yes! We offer on-demand video tutorials, a comprehensive help center, and live webinars for new users. Pro and Enterprise customers also get personalized onboarding sessions."
        }
      ]
    },
    {
      name: "Features & Content",
      faqs: [
        {
          id: "content-library",
          question: "What content is included in the library?",
          answer: "Our library includes evidence-based content on pain neuroscience, movement education, self-management strategies, and condition-specific information. Content is created by clinicians and reviewed by experts. Pro plans include the full library; Basic plans include core content."
        },
        {
          id: "assessments",
          question: "What assessments are available?",
          answer: "We offer validated screening tools including fear-avoidance beliefs questionnaires, pain catastrophizing scales, and outcome measures. Pro plans include advanced assessments and custom assessment builder."
        },
        {
          id: "care-pathways",
          question: "What are care pathways?",
          answer: "Care pathways are automated sequences of content and assessments tailored to specific conditions or treatment phases. They deliver the right education at the right time throughout the patient's care journey. Available on Pro and Enterprise plans."
        },
        {
          id: "customization",
          question: "Can I customize the content?",
          answer: "Pro and Enterprise plans include custom branding options, allowing you to add your logo and practice colors. Enterprise plans offer custom content creation and white-label options."
        }
      ]
    },
    {
      name: "Patient Experience",
      faqs: [
        {
          id: "patient-access",
          question: "How do patients access their content?",
          answer: "Patients receive an email invitation with a secure link to their personalized patient portal. They log in using their email and a 6-digit access code. No app download required - everything works in their web browser."
        },
        {
          id: "patient-data",
          question: "What patient data is collected?",
          answer: "We collect patient name, email, assessment responses, and content viewing activity. All data is encrypted and stored securely. Clinicians can see engagement metrics and assessment scores in their dashboard."
        },
        {
          id: "mobile",
          question: "Does the patient portal work on mobile?",
          answer: "Yes! The patient portal is fully responsive and optimized for smartphones and tablets. Patients can view content and complete assessments on any device."
        }
      ]
    },
    {
      name: "Billing & Plans",
      faqs: [
        {
          id: "pricing",
          question: "How much does DriverPath cost?",
          answer: "Basic plans start at $29/month, Pro plans are $79/month, and Enterprise pricing is customized based on your organization's needs. Annual billing saves 20%. All plans include a 14-day free trial."
        },
        {
          id: "upgrade",
          question: "Can I upgrade or downgrade my plan?",
          answer: "Yes, you can change your plan at any time from your account settings. Upgrades take effect immediately, and downgrades take effect at the start of your next billing cycle."
        },
        {
          id: "cancellation",
          question: "What happens if I cancel?",
          answer: "You can cancel anytime. Your access continues until the end of your current billing period. After cancellation, you can export your data and patient records."
        },
        {
          id: "payment",
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards (Visa, MasterCard, American Express, Discover). Enterprise customers can request invoice billing with NET 30 terms."
        }
      ]
    },
    {
      name: "Security & Compliance",
      faqs: [
        {
          id: "hipaa",
          question: "Is DriverPath HIPAA compliant?",
          answer: "Yes. We implement all required administrative, physical, and technical safeguards. We execute Business Associate Agreements (BAAs) with all customers and provide detailed security documentation upon request."
        },
        {
          id: "data-security",
          question: "How is patient data protected?",
          answer: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We use secure hosting infrastructure, role-based access controls, and maintain comprehensive audit logs. Regular security assessments are conducted."
        },
        {
          id: "data-ownership",
          question: "Who owns the patient data?",
          answer: "You do. As the clinician, you own and control all patient data. We only process data to provide our services and never sell or share data with third parties for marketing."
        }
      ]
    },
    {
      name: "Technical Support",
      faqs: [
        {
          id: "support-hours",
          question: "What are your support hours?",
          answer: "Email support is available Monday-Friday, 9am-5pm EST. Pro customers get priority response times (within 4 hours). Enterprise customers have access to dedicated support and phone assistance."
        },
        {
          id: "integrations",
          question: "Does DriverPath integrate with my EHR?",
          answer: "We offer API access for Enterprise customers to integrate with electronic health records and practice management systems. Contact us to discuss your specific integration needs."
        },
        {
          id: "browser",
          question: "What browsers are supported?",
          answer: "DriverPath works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience."
        }
      ]
    }
  ];

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const filteredCategories = categories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <PublicLayout>
      <div className="py-16 bg-gray-50" data-testid="faq-hero">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4" data-testid="faq-heading">
            Help Center
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8" data-testid="faq-description">
            Find answers to common questions about DriverPath.
          </p>
          
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
              data-testid="input-search"
            />
          </div>
        </div>
      </div>

      <div className="py-16" data-testid="faq-content">
        <div className="container mx-auto px-6 max-w-4xl">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12" data-testid="no-results">
              <p className="text-muted-foreground mb-4">No results found for "{searchQuery}"</p>
              <Button variant="outline" onClick={() => setSearchQuery("")} data-testid="button-clear-search">
                Clear search
              </Button>
            </div>
          ) : (
            <div className="space-y-12">
              {filteredCategories.map((category, i) => (
                <div key={i} data-testid={`category-${i}`}>
                  <h2 className="text-xl font-bold text-gray-900 mb-4" data-testid={`heading-category-${i}`}>
                    {category.name}
                  </h2>
                  <div className="space-y-3">
                    {category.faqs.map((faq) => (
                      <Card key={faq.id} data-testid={`card-faq-${faq.id}`}>
                        <CardContent className="p-0">
                          <button
                            onClick={() => toggleItem(faq.id)}
                            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                            data-testid={`button-faq-${faq.id}`}
                          >
                            <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                            {openItems.has(faq.id) ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            )}
                          </button>
                          {openItems.has(faq.id) && (
                            <div className="px-4 pb-4 text-muted-foreground" data-testid={`answer-faq-${faq.id}`}>
                              {faq.answer}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="py-16 bg-gray-50" data-testid="section-contact">
        <div className="container mx-auto px-6 text-center">
          <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4" data-testid="heading-contact">
            Still Have Questions?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Our support team is here to help. Reach out and we'll get back to you within 24 hours.
          </p>
          <Link href="/contact">
            <Button size="lg" data-testid="button-contact">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
