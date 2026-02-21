import { Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Activity, Heart, Brain, Bone, Zap, Stethoscope, Check } from "lucide-react";

export default function UseCasesPage() {
  const specialties = [
    {
      id: "physical-therapy",
      icon: Activity,
      title: "Physical Therapy",
      subtitle: "Orthopedic & Sports Rehabilitation",
      description: "Enhance patient outcomes with evidence-based education that supports manual therapy and exercise prescription.",
      useCases: [
        "Pre-surgery education and preparation",
        "Post-operative recovery pathways",
        "Chronic pain management",
        "Return-to-sport programming",
        "Home exercise program reinforcement"
      ],
      benefits: [
        "Improve patient adherence to HEP",
        "Reduce no-show rates",
        "Screen for fear-avoidance before treatment",
        "Track patient progress between visits"
      ],
      stat: "47% average improvement in adherence"
    },
    {
      id: "chiropractic",
      icon: Bone,
      title: "Chiropractic Care",
      subtitle: "Spine Health & Wellness",
      description: "Support chiropractic adjustments with patient education that promotes understanding and self-management.",
      useCases: [
        "Spinal health education",
        "Posture and ergonomics guidance",
        "Movement and exercise recommendations",
        "Pain neuroscience education",
        "Wellness maintenance programs"
      ],
      benefits: [
        "Build patient understanding of care",
        "Support active lifestyle changes",
        "Reduce dependency on passive care",
        "Improve treatment compliance"
      ],
      stat: "38% reduction in passive care dependency"
    },
    {
      id: "pain-management",
      icon: Brain,
      title: "Pain Management",
      subtitle: "Interventional & Conservative Care",
      description: "Address the biopsychosocial factors of chronic pain with specialized pain neuroscience content.",
      useCases: [
        "Pre-procedure patient preparation",
        "Chronic pain education programs",
        "Opioid reduction support",
        "Yellow flag screening",
        "Multidisciplinary care coordination"
      ],
      benefits: [
        "Identify high-risk patients early",
        "Support comprehensive pain programs",
        "Reduce fear-avoidance behaviors",
        "Improve procedure outcomes"
      ],
      stat: "35% reduction in fear-avoidance scores"
    },
    {
      id: "orthopedics",
      icon: Stethoscope,
      title: "Orthopedic Surgery",
      subtitle: "Joint Replacement & Sports Surgery",
      description: "Optimize surgical outcomes with comprehensive pre-hab and post-operative education pathways.",
      useCases: [
        "Total joint replacement preparation",
        "Arthroscopic surgery education",
        "Fracture care and recovery",
        "Sports injury rehabilitation",
        "Post-surgical milestone tracking"
      ],
      benefits: [
        "Reduce surgical anxiety",
        "Improve post-op compliance",
        "Accelerate recovery timelines",
        "Decrease readmission rates"
      ],
      stat: "23% faster return to function"
    },
    {
      id: "occupational-therapy",
      icon: Heart,
      title: "Occupational Therapy",
      subtitle: "Functional Independence",
      description: "Support patients in regaining independence with education tailored to daily living activities.",
      useCases: [
        "Upper extremity rehabilitation",
        "Hand therapy education",
        "Work conditioning programs",
        "Activities of daily living",
        "Ergonomic workplace modifications"
      ],
      benefits: [
        "Reinforce clinic-based learning",
        "Support home program compliance",
        "Track functional progress",
        "Coordinate with care teams"
      ],
      stat: "41% improvement in ADL independence"
    },
    {
      id: "sports-medicine",
      icon: Zap,
      title: "Sports Medicine",
      subtitle: "Performance & Recovery",
      description: "Help athletes understand their injuries and optimize recovery with sport-specific content.",
      useCases: [
        "Injury prevention education",
        "Return-to-play protocols",
        "Concussion management",
        "Overuse injury education",
        "Performance optimization"
      ],
      benefits: [
        "Build athlete confidence",
        "Reduce re-injury rates",
        "Support graduated return protocols",
        "Educate on load management"
      ],
      stat: "28% reduction in re-injury rates"
    }
  ];

  return (
    <PublicLayout>
      <div className="py-16 bg-gray-50" data-testid="use-cases-hero">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4" data-testid="use-cases-heading">
            Built for Your Specialty
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="use-cases-description">
            DriverPath adapts to your clinical practice with specialty-specific content and workflows.
          </p>
        </div>
      </div>

      <div className="py-16" data-testid="section-specialties">
        <div className="container mx-auto px-6">
          <div className="grid gap-8">
            {specialties.map((specialty, i) => (
              <Card key={specialty.id} className="overflow-hidden" data-testid={`card-specialty-${specialty.id}`}>
                <CardContent className="p-0">
                  <div className="grid lg:grid-cols-3">
                    <div className="p-8 lg:p-10 lg:col-span-2">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                          <specialty.icon className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900" data-testid={`title-specialty-${specialty.id}`}>
                            {specialty.title}
                          </h2>
                          <p className="text-muted-foreground">{specialty.subtitle}</p>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-6">{specialty.description}</p>

                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Common Use Cases</h3>
                          <ul className="space-y-2">
                            {specialty.useCases.map((useCase, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>{useCase}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Key Benefits</h3>
                          <ul className="space-y-2">
                            {specialty.benefits.map((benefit, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary p-8 lg:p-10 flex flex-col justify-center text-white">
                      <div className="text-center lg:text-left">
                        <div className="text-3xl font-bold mb-2" data-testid={`stat-specialty-${specialty.id}`}>
                          {specialty.stat}
                        </div>
                        <p className="text-primary-foreground/80 text-sm mb-6">
                          Reported by {specialty.title.toLowerCase()} practices using DriverPath
                        </p>
                        <Link href="/auth?signup=true">
                          <Button variant="secondary" className="w-full lg:w-auto" data-testid={`button-specialty-${specialty.id}`}>
                            Start Free Trial
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 bg-gray-50" data-testid="section-custom">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4" data-testid="heading-custom">
            Don't See Your Specialty?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            DriverPath's flexible platform works for any clinical practice that values patient education. 
            Contact us to discuss your specific needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="h-12 px-8" data-testid="button-contact">
                Contact Us <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/case-studies">
              <Button size="lg" variant="outline" className="h-12 px-8" data-testid="button-case-studies">
                View Success Stories
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
