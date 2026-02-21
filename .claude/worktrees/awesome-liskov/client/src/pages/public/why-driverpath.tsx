import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Clock,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Save 5+ Hours Weekly",
    description:
      "Stop recreating patient handouts from scratch. Access a curated library of evidence-based content ready to send.",
    metric: "5+ hrs",
    metricLabel: "saved per week",
  },
  {
    icon: TrendingUp,
    title: "Improve Patient Outcomes",
    description:
      "Patients who understand their condition show 40% better adherence and faster return to activity.",
    metric: "40%",
    metricLabel: "better adherence",
  },
  {
    icon: DollarSign,
    title: "Increase Practice Revenue",
    description:
      "Reduce no-shows and cancellations by keeping patients engaged between visits with automated follow-ups.",
    metric: "25%",
    metricLabel: "fewer no-shows",
  },
  {
    icon: Users,
    title: "Better Patient Experience",
    description:
      "Patients rate their care higher when they feel heard and educated about their condition.",
    metric: "4.8/5",
    metricLabel: "patient satisfaction",
  },
];

const comparisons = [
  {
    feature: "Evidence-based content library",
    driverpath: true,
    others: "Limited or generic",
  },
  {
    feature: "Pain neuroscience education focus",
    driverpath: true,
    others: "Not specialized",
  },
  {
    feature: "Automated patient assessments",
    driverpath: true,
    others: "Manual only",
  },
  {
    feature: "Yellow flag screening",
    driverpath: true,
    others: "Not included",
  },
  {
    feature: "Care pathways & follow-ups",
    driverpath: true,
    others: "Extra cost",
  },
  {
    feature: "HIPAA-compliant patient portal",
    driverpath: true,
    others: "Varies",
  },
  {
    feature: "Built by clinicians",
    driverpath: true,
    others: "Tech-first approach",
  },
  {
    feature: "Continuous content updates",
    driverpath: true,
    others: "Static content",
  },
];

const testimonials = [
  {
    quote:
      "DriverPath has transformed how I educate patients about chronic pain. They actually understand why they hurt now.",
    author: "Dr. Amanda Chen, PT",
    practice: "Pacific Coast Physical Therapy",
  },
  {
    quote:
      "The assessment tools save me so much time. I can screen for yellow flags before patients even walk in the door.",
    author: "Michael Torres, DPT",
    practice: "Peak Performance Rehab",
  },
  {
    quote:
      "My patients are more engaged than ever. The educational content keeps them motivated between sessions.",
    author: "Sarah Williams, DC",
    practice: "Integrated Spine Care",
  },
];

export default function WhyDriverPathPage() {
  return (
    <PublicLayout>
      <section className="py-20 bg-gradient-to-b from-secondary/20 to-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4" data-testid="badge-why-choose">
              Why Choose Us
            </Badge>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6" data-testid="heading-why">
              The Clinician-First Platform for Patient Education
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed" data-testid="text-why-description">
              Built by physical therapists, for physical therapists. DriverPath combines
              evidence-based content with powerful tools to help you deliver better care.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="section-benefits">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4" data-testid="heading-impact">Measurable Impact</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real results from clinicians using DriverPath in their practice.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={benefit.title} className="relative overflow-hidden" data-testid={`card-benefit-${index}`}>
                <CardContent className="pt-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary mb-1" data-testid={`metric-${index}`}>{benefit.metric}</div>
                  <div className="text-sm text-muted-foreground mb-4">{benefit.metricLabel}</div>
                  <h3 className="font-bold mb-2" data-testid={`title-benefit-${index}`}>{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50" data-testid="section-comparison">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4" data-testid="heading-comparison">What Makes Us Different</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how DriverPath compares to other patient education solutions.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <Card data-testid="comparison-table">
              <CardHeader>
                <div className="grid grid-cols-3 text-center">
                  <div></div>
                  <div>
                    <CardTitle className="text-primary flex items-center justify-center gap-2" data-testid="column-driverpath">
                      <Sparkles className="w-5 h-5" />
                      DriverPath
                    </CardTitle>
                  </div>
                  <div>
                    <CardTitle className="text-muted-foreground" data-testid="column-others">Others</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {comparisons.map((item, index) => (
                    <div key={item.feature} className="grid grid-cols-3 py-4 items-center" data-testid={`comparison-row-${index}`}>
                      <div className="text-sm font-medium" data-testid={`feature-${index}`}>{item.feature}</div>
                      <div className="text-center">
                        <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto" />
                      </div>
                      <div className="text-center text-sm text-muted-foreground">{item.others}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="section-testimonials">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4" data-testid="heading-testimonials">Trusted by Clinicians</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from healthcare providers who've transformed their practice with DriverPath.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={testimonial.author} data-testid={`testimonial-${index}`}>
                <CardContent className="pt-8">
                  <p className="text-muted-foreground italic mb-6" data-testid={`quote-${index}`}>"{testimonial.quote}"</p>
                  <div>
                    <div className="font-bold" data-testid={`author-${index}`}>{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground" data-testid={`practice-${index}`}>{testimonial.practice}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50" data-testid="section-trust">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div data-testid="trust-hipaa">
                <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">HIPAA Compliant</h3>
                <p className="text-sm text-muted-foreground">
                  Enterprise-grade security and compliance built in from day one.
                </p>
              </div>
              <div data-testid="trust-setup">
                <Zap className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">Quick Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Get started in minutes with our intuitive onboarding process.
                </p>
              </div>
              <div data-testid="trust-support">
                <Users className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">Dedicated Support</h3>
                <p className="text-sm text-muted-foreground">
                  Our team of clinicians is here to help you succeed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-white" data-testid="section-cta">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-serif font-bold mb-4" data-testid="heading-cta">
            Ready to See the Difference?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join 500+ clinicians who are already using DriverPath to improve patient outcomes and
            save time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?signup=true">
              <Button size="lg" variant="secondary" className="rounded-full" data-testid="button-start-trial">
                Start 14-Day Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/features">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full bg-transparent border-white text-white hover:bg-white/10"
                data-testid="button-explore-features"
              >
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
