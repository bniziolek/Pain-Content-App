import { PublicLayout } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Heart, Target, Users, Lightbulb, ArrowRight } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Patient-Centered Care",
    description:
      "Everything we build starts with the patient experience. We believe informed patients become active participants in their recovery.",
  },
  {
    icon: Target,
    title: "Evidence-Based Practice",
    description:
      "Our content and recommendations are grounded in the latest research in pain science and rehabilitation.",
  },
  {
    icon: Users,
    title: "Clinician Partnership",
    description:
      "We work alongside healthcare providers to understand their challenges and build tools that genuinely help.",
  },
  {
    icon: Lightbulb,
    title: "Continuous Innovation",
    description:
      "We're constantly improving our platform based on clinical feedback and emerging research.",
  },
];

const team = [
  {
    name: "Dr. Sarah Mitchell",
    role: "Founder & Chief Clinical Officer",
    bio: "Physical therapist with 15+ years specializing in chronic pain management and pain neuroscience education.",
  },
  {
    name: "James Chen",
    role: "Co-Founder & CEO",
    bio: "Healthcare technology entrepreneur passionate about improving patient outcomes through better education.",
  },
  {
    name: "Dr. Emily Rodriguez",
    role: "Head of Content",
    bio: "DPT with expertise in patient education and therapeutic alliance. Leads our content curation team.",
  },
  {
    name: "Michael Park",
    role: "Chief Technology Officer",
    bio: "Software engineer with a background in healthcare informatics and a focus on HIPAA-compliant systems.",
  },
];

export default function AboutPage() {
  return (
    <PublicLayout>
      <section className="py-20 bg-gradient-to-b from-secondary/20 to-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6" data-testid="heading-about">
              About Health Drivers Institute
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed" data-testid="text-about-description">
              We're on a mission to transform how clinicians educate patients about pain. By
              bridging the gap between research and practice, we help healthcare providers deliver
              better outcomes.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="section-story">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-serif font-bold mb-6" data-testid="heading-story">Our Story</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  DriverPath was born from a simple observation: despite decades of advances in
                  pain science, most patients still receive outdated explanations for their
                  symptoms. The result? Fear, frustration, and prolonged recovery times.
                </p>
                <p>
                  Our founder, Dr. Sarah Mitchell, spent years developing patient education
                  materials that actually worked. Patients who understood the "why" behind their
                  pain showed better adherence, less fear-avoidance, and faster returns to
                  meaningful activity.
                </p>
                <p>
                  In 2023, we launched DriverPath to bring these evidence-based education tools to
                  every clinician. Today, we serve hundreds of physical therapists, chiropractors,
                  and pain specialists across the country.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/30 rounded-3xl h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2" data-testid="stat-clinicians">500+</div>
                <div className="text-muted-foreground">Clinicians trust DriverPath</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50" data-testid="section-values">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4" data-testid="heading-values">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These principles guide everything we do, from product development to customer
              support.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={value.title} className="text-center" data-testid={`card-value-${index}`}>
                <CardContent className="pt-8">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2" data-testid={`title-value-${index}`}>{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="section-team">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4" data-testid="heading-team">Meet the Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A passionate group of clinicians, researchers, and technologists working to improve
              patient outcomes.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={member.name} className="text-center" data-testid={`card-team-${index}`}>
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4" />
                <h3 className="font-bold" data-testid={`name-team-${index}`}>{member.name}</h3>
                <p className="text-sm text-primary mb-2" data-testid={`role-team-${index}`}>{member.role}</p>
                <p className="text-sm text-muted-foreground">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-white" data-testid="section-cta">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-serif font-bold mb-4" data-testid="heading-cta">Join Our Mission</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Help us transform patient education in healthcare. Start your free trial today and see
            the difference evidence-based content makes.
          </p>
          <Link href="/auth?signup=true">
            <Button size="lg" variant="secondary" className="rounded-full" data-testid="button-cta-get-started">
              Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
