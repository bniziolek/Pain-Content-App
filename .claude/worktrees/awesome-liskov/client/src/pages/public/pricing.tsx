import { Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, HelpCircle, Zap, Shield, Users, ArrowRight } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Basic",
      price: "$29",
      period: "/month",
      description: "Perfect for individual practitioners getting started with patient education",
      features: [
        { name: "Up to 50 active patients", included: true },
        { name: "Core content library", included: true },
        { name: "Basic assessments", included: true },
        { name: "Email support", included: true },
        { name: "Patient portal access", included: true },
        { name: "Advanced analytics", included: false },
        { name: "Custom branding", included: false },
        { name: "Care pathways", included: false },
        { name: "Priority support", included: false },
        { name: "API access", included: false }
      ],
      cta: "Start Free Trial",
      ctaVariant: "outline" as const,
      popular: false
    },
    {
      name: "Pro",
      price: "$79",
      period: "/month",
      description: "For growing practices that need more power and customization",
      features: [
        { name: "Unlimited patients", included: true },
        { name: "Full content library", included: true },
        { name: "Advanced assessments", included: true },
        { name: "Priority email support", included: true },
        { name: "Patient portal access", included: true },
        { name: "Advanced analytics", included: true },
        { name: "Custom branding", included: true },
        { name: "Care pathways", included: true },
        { name: "Priority support", included: false },
        { name: "API access", included: false }
      ],
      cta: "Start Free Trial",
      ctaVariant: "default" as const,
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations with advanced compliance and integration needs",
      features: [
        { name: "Unlimited patients", included: true },
        { name: "Full content library", included: true },
        { name: "Advanced assessments", included: true },
        { name: "Dedicated account manager", included: true },
        { name: "Patient portal access", included: true },
        { name: "Advanced analytics", included: true },
        { name: "Custom branding", included: true },
        { name: "Care pathways", included: true },
        { name: "Priority support", included: true },
        { name: "API access", included: true }
      ],
      cta: "Contact Sales",
      ctaVariant: "outline" as const,
      popular: false
    }
  ];

  const faqs = [
    {
      question: "Is there a free trial?",
      answer: "Yes! All plans include a 14-day free trial with full access to features. No credit card required to start."
    },
    {
      question: "Can I change plans later?",
      answer: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express) and can arrange invoicing for Enterprise customers."
    },
    {
      question: "Is DriverPath HIPAA compliant?",
      answer: "Yes. We execute Business Associate Agreements (BAAs) with all customers and implement all required safeguards for PHI protection."
    },
    {
      question: "Do you offer discounts for annual billing?",
      answer: "Yes, annual billing saves you 20% compared to monthly billing. Contact us for details."
    },
    {
      question: "What happens if I exceed my patient limit?",
      answer: "On the Basic plan, you'll be notified when approaching your limit and can upgrade to Pro for unlimited patients."
    }
  ];

  return (
    <PublicLayout>
      <div className="py-16 bg-gray-50" data-testid="pricing-hero">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4" data-testid="pricing-heading">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="pricing-description">
            Choose the plan that fits your practice. All plans include a 14-day free trial.
          </p>
        </div>
      </div>

      <div className="py-16" data-testid="pricing-plans">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <Card 
                key={i} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
                data-testid={`card-plan-${plan.name.toLowerCase()}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full" data-testid="badge-popular">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className="text-2xl font-bold" data-testid={`title-plan-${plan.name.toLowerCase()}`}>{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold" data-testid={`price-plan-${plan.name.toLowerCase()}`}>{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-3" data-testid={`feature-${plan.name.toLowerCase()}-${j}`}>
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-gray-900' : 'text-gray-400'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.name === 'Enterprise' ? '/contact' : '/auth?signup=true'}>
                    <Button 
                      variant={plan.ctaVariant} 
                      className="w-full" 
                      size="lg"
                      data-testid={`button-plan-${plan.name.toLowerCase()}`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 bg-gray-50" data-testid="section-comparison">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4" data-testid="heading-comparison">
              Why Clinicians Choose DriverPath
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              More than just patient education software - a complete engagement platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Zap,
                title: "Quick Setup",
                description: "Get started in minutes. No complex onboarding or training required."
              },
              {
                icon: Shield,
                title: "HIPAA Compliant",
                description: "Enterprise-grade security with full HIPAA compliance and BAA support."
              },
              {
                icon: Users,
                title: "Better Outcomes",
                description: "Clinicians report 45% improvement in patient adherence and engagement."
              }
            ].map((benefit, i) => (
              <div key={i} className="text-center" data-testid={`benefit-${i}`}>
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16" data-testid="section-faq">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4" data-testid="heading-faq">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqs.map((faq, i) => (
              <Card key={i} data-testid={`card-faq-${i}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2" data-testid={`question-faq-${i}`}>{faq.question}</h3>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 bg-primary" data-testid="section-cta">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-4" data-testid="heading-cta">
            Ready to Transform Patient Education?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join 500+ clinicians already using DriverPath to improve patient outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?signup=true">
              <Button size="lg" variant="secondary" className="h-12 px-8" data-testid="button-cta-trial">
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-12 px-8 border-white text-white hover:bg-white/10" data-testid="button-cta-contact">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
