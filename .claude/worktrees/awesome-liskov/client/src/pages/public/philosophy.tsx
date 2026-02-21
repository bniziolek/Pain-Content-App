import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Brain, Heart, Users, Zap, ArrowRight, Quote } from "lucide-react";

const principles = [
  {
    icon: Brain,
    title: "Pain is an Output, Not an Input",
    description:
      "Modern neuroscience shows that pain is produced by the brain as a protective response, not simply transmitted from tissues. This shifts our focus from 'fixing' tissues to helping patients understand their nervous system.",
  },
  {
    icon: Heart,
    title: "The Biopsychosocial Model",
    description:
      "Pain and recovery are influenced by biological, psychological, and social factors. Effective treatment must address all three domains, not just the physical.",
  },
  {
    icon: Users,
    title: "Patient as Partner",
    description:
      "Patients who understand their condition become active participants in their recovery. Education empowers patients to make informed decisions and reduces dependency on passive treatments.",
  },
  {
    icon: Zap,
    title: "Neuroplasticity and Hope",
    description:
      "The nervous system can change. Persistent pain doesn't mean permanent pain. With the right education and approach, patients can retrain their pain response.",
  },
];

const pillars = [
  {
    title: "Why You Hurt, Not Where You Hurt",
    content:
      "Traditional approaches focus on finding and fixing the source of pain. But research shows that tissue damage often doesn't correlate with pain intensity. We help patients understand the complex factors that contribute to their experience.",
  },
  {
    title: "Reducing Fear-Avoidance",
    content:
      "Fear of movement is one of the strongest predictors of chronic pain development. Our educational content is specifically designed to reduce fear-avoidance beliefs and encourage safe, graded return to activity.",
  },
  {
    title: "Therapeutic Alliance",
    content:
      "The relationship between clinician and patient is itself therapeutic. We help clinicians build trust through shared decision-making, validation, and clear communication.",
  },
  {
    title: "Evidence-Based, Clinician-Tested",
    content:
      "Every piece of content in DriverPath is grounded in peer-reviewed research and refined based on feedback from practicing clinicians. We bridge the gap between academia and clinical practice.",
  },
];

export default function PhilosophyPage() {
  return (
    <PublicLayout>
      <section className="py-20 bg-gradient-to-b from-secondary/20 to-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6" data-testid="heading-philosophy">
              Our Clinical Philosophy
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed" data-testid="text-philosophy-description">
              At the heart of DriverPath is a fundamental shift in how we think about pain,
              recovery, and the role of education in healthcare.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="section-quote">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-primary/5 rounded-3xl p-8 md:p-12 mb-16">
              <Quote className="w-12 h-12 text-primary mb-6" />
              <blockquote className="text-2xl md:text-3xl font-serif text-gray-900 leading-relaxed mb-6" data-testid="quote-moseley">
                "Pain is not a measure of tissue damage. Pain is the brain's opinion about the
                danger to the body and what you should do about it."
              </blockquote>
              <cite className="text-muted-foreground" data-testid="cite-moseley">
                — Lorimer Moseley, Professor of Clinical Neurosciences
              </cite>
            </div>

            <div className="prose prose-lg max-w-none mb-16" data-testid="section-understanding">
              <h2 className="font-serif" data-testid="heading-understanding">A New Understanding of Pain</h2>
              <p>
                For decades, healthcare operated under a biomedical model that viewed pain as a
                direct signal from damaged tissues. Find the damage, fix it, and the pain goes away.
                But this model fails to explain why two people with identical MRIs can have vastly
                different pain experiences, or why pain can persist long after tissues have healed.
              </p>
              <p>
                Modern pain neuroscience has given us a new understanding. Pain is produced by the
                brain as a protective mechanism—an alarm system designed to motivate behavior change.
                It's influenced not just by tissue state, but by our beliefs, emotions, past
                experiences, sleep, stress, and social context.
              </p>
              <p>
                This isn't to say that pain is "all in your head." Pain is very real. But
                understanding its true nature opens up new pathways for recovery that don't rely
                solely on passive treatments or surgical interventions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50" data-testid="section-principles">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4" data-testid="heading-principles">Core Principles</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These principles inform every piece of content we create and every feature we build.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {principles.map((principle, index) => (
              <Card key={principle.title} data-testid={`card-principle-${index}`}>
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <principle.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3" data-testid={`title-principle-${index}`}>{principle.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{principle.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="section-pillars">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif font-bold mb-12 text-center" data-testid="heading-pillars">
              The Four Pillars of Our Approach
            </h2>
            <div className="space-y-8">
              {pillars.map((pillar, index) => (
                <div key={pillar.title} className="flex gap-6" data-testid={`pillar-${index}`}>
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg" data-testid={`pillar-number-${index}`}>
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2" data-testid={`title-pillar-${index}`}>{pillar.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{pillar.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-white" data-testid="section-cta">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-serif font-bold mb-4" data-testid="heading-cta">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join hundreds of clinicians who are already using pain neuroscience education to
            improve patient outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?signup=true">
              <Button size="lg" variant="secondary" className="rounded-full" data-testid="button-start-trial">
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/blog">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full bg-transparent border-white text-white hover:bg-white/10"
                data-testid="button-read-articles"
              >
                Read Our Articles
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
