import { Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Quote, TrendingUp, Users, Clock, Award } from "lucide-react";

export default function CaseStudiesPage() {
  const caseStudies = [
    {
      id: "pt-associates",
      title: "Physical Therapy Associates",
      subtitle: "Multi-location PT practice",
      quote: "DriverPath transformed how we educate patients. Our adherence rates improved dramatically, and patients actually understand why they're doing their exercises.",
      author: "Dr. Sarah Mitchell, DPT",
      role: "Clinical Director",
      stats: [
        { label: "Patient Adherence", value: "+47%", icon: TrendingUp },
        { label: "Time Saved", value: "8 hrs/week", icon: Clock },
        { label: "Patient Satisfaction", value: "4.9/5", icon: Award }
      ],
      specialty: "Physical Therapy",
      size: "12 clinicians",
      challenge: "Struggling with patient compliance and spending too much time on repetitive education during appointments.",
      solution: "Implemented DriverPath to automate pre-visit education and post-treatment reinforcement.",
      results: "Patients arrive better prepared, treatment time is more productive, and outcomes have measurably improved."
    },
    {
      id: "spine-center",
      title: "Midwest Spine & Pain Center",
      subtitle: "Interventional pain management",
      quote: "The pain neuroscience content is exactly what our patients need. It helps them understand their condition beyond just 'where it hurts.'",
      author: "Dr. James Chen, MD",
      role: "Medical Director",
      stats: [
        { label: "Fear-Avoidance Reduction", value: "-35%", icon: TrendingUp },
        { label: "Patients Served", value: "2,400+", icon: Users },
        { label: "Content Engagement", value: "89%", icon: Award }
      ],
      specialty: "Pain Management",
      size: "6 providers",
      challenge: "Patients with chronic pain often have high fear-avoidance beliefs that hinder recovery.",
      solution: "Used DriverPath's pain neuroscience content library and automated assessments to screen for yellow flags.",
      results: "Better identification of at-risk patients and targeted education that addresses psychological factors."
    },
    {
      id: "orthopedic-sports",
      title: "Elite Orthopedic Sports Medicine",
      subtitle: "Sports medicine and rehabilitation",
      quote: "Our athletes appreciate the evidence-based approach. The content is professional and builds trust from day one.",
      author: "Dr. Maria Rodriguez, PT, OCS",
      role: "Sports Rehab Lead",
      stats: [
        { label: "Return to Sport", value: "23% faster", icon: TrendingUp },
        { label: "Patient Base", value: "500+ athletes", icon: Users },
        { label: "Satisfaction Score", value: "98%", icon: Award }
      ],
      specialty: "Sports Medicine",
      size: "8 clinicians",
      challenge: "Athletes need clear, actionable education to optimize recovery and prevent re-injury.",
      solution: "Customized DriverPath pathways for pre-surgery, post-surgery, and return-to-sport phases.",
      results: "Athletes are more engaged in their recovery and report feeling more confident in their return to activity."
    }
  ];

  const metrics = [
    { value: "500+", label: "Clinicians using DriverPath" },
    { value: "50,000+", label: "Patients educated" },
    { value: "45%", label: "Average adherence improvement" },
    { value: "4.8/5", label: "Average satisfaction rating" }
  ];

  return (
    <PublicLayout>
      <div className="py-16 bg-gray-50" data-testid="case-studies-hero">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4" data-testid="case-studies-heading">
            Success Stories
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="case-studies-description">
            See how clinicians are using DriverPath to improve patient outcomes and streamline their practice.
          </p>
        </div>
      </div>

      <div className="py-12 bg-primary" data-testid="section-metrics">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {metrics.map((metric, i) => (
              <div key={i} className="text-center" data-testid={`metric-${i}`}>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1" data-testid={`metric-value-${i}`}>{metric.value}</div>
                <div className="text-primary-foreground/80 text-sm">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16" data-testid="section-case-studies">
        <div className="container mx-auto px-6">
          <div className="space-y-16">
            {caseStudies.map((study, i) => (
              <Card key={study.id} className="overflow-hidden" data-testid={`card-case-study-${study.id}`}>
                <CardContent className="p-0">
                  <div className="grid lg:grid-cols-2">
                    <div className="p-8 lg:p-12">
                      <div className="flex items-center gap-2 text-sm text-primary font-medium mb-4">
                        <span>{study.specialty}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{study.size}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid={`title-case-study-${study.id}`}>
                        {study.title}
                      </h2>
                      <p className="text-muted-foreground mb-6">{study.subtitle}</p>

                      <div className="bg-gray-50 p-6 rounded-xl mb-6" data-testid={`quote-case-study-${study.id}`}>
                        <Quote className="w-8 h-8 text-primary/20 mb-2" />
                        <p className="text-gray-900 italic mb-4">{study.quote}</p>
                        <div>
                          <p className="font-semibold text-gray-900">{study.author}</p>
                          <p className="text-sm text-muted-foreground">{study.role}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {study.stats.map((stat, j) => (
                          <div key={j} className="text-center" data-testid={`stat-${study.id}-${j}`}>
                            <stat.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                            <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                            <div className="text-xs text-muted-foreground">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-8 lg:p-12 border-l border-gray-100">
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">The Challenge</h3>
                          <p className="text-muted-foreground text-sm">{study.challenge}</p>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">The Solution</h3>
                          <p className="text-muted-foreground text-sm">{study.solution}</p>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">The Results</h3>
                          <p className="text-muted-foreground text-sm">{study.results}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 bg-gray-50" data-testid="section-cta">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4" data-testid="heading-cta">
            Ready to Write Your Success Story?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join these clinicians and start improving patient outcomes today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?signup=true">
              <Button size="lg" className="h-12 px-8" data-testid="button-cta-trial">
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-12 px-8" data-testid="button-cta-contact">
                Request a Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
