import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Shield, Activity, Brain, Users } from "lucide-react";
import heroImage from '@/assets/generated_images/clinician_consulting_patient_in_modern_office.png';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50" data-testid="landing-nav">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary" data-testid="landing-logo">
              <Activity className="w-6 h-6" />
              <span>DriverPath</span>
            </div>
            <div className="hidden lg:flex items-center gap-6">
              <Link href="/about">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer" data-testid="landing-nav-about">About</span>
              </Link>
              <Link href="/philosophy">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer" data-testid="landing-nav-philosophy">Clinical Philosophy</span>
              </Link>
              <Link href="/features">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer" data-testid="landing-nav-features">Features</span>
              </Link>
              <Link href="/why-driverpath">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer" data-testid="landing-nav-why">Why DriverPath</span>
              </Link>
              <Link href="/blog">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer" data-testid="landing-nav-blog">Blog</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button variant="ghost" data-testid="landing-button-login">Log In</Button>
            </Link>
            <Link href="/auth?signup=true">
              <Button data-testid="landing-button-get-started">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden" data-testid="section-hero">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl font-serif font-bold leading-tight text-gray-900" data-testid="heading-hero">
                Patient education that actually <span className="text-primary italic">connects</span>.
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg" data-testid="text-hero-description">
                Empower your patients with evidence-based content and automated assessments. Move beyond "where it hurts" to "why it hurts."
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth?signup=true">
                  <Button size="lg" className="h-12 px-8 text-lg rounded-full" data-testid="button-hero-trial">
                    Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full" data-testid="button-hero-login">
                    Provider Login
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground" data-testid="trust-badge">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white" />
                  ))}
                </div>
                <span data-testid="text-trust">Trusted by 500+ Clinicians</span>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-secondary/30 rounded-[2rem] transform rotate-3 blur-lg" />
              <img 
                src={heroImage} 
                alt="Clinician with patient" 
                className="relative rounded-[1.5rem] shadow-2xl w-full object-cover aspect-[4/3] border border-gray-100"
                data-testid="image-hero"
              />
              
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000" data-testid="badge-adherence">
                <div className="bg-green-100 p-2 rounded-lg text-green-600">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900" data-testid="text-adherence-title">Patient Adherence</div>
                  <div className="text-xs text-muted-foreground" data-testid="text-adherence-stat">Up 45% this month</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gray-50" data-testid="section-features">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4" data-testid="heading-features">The modern toolkit for recovery</h2>
            <p className="text-muted-foreground text-lg" data-testid="text-features-description">
              Combine clinical expertise with automated education to deliver better outcomes at scale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Pain Neuroscience",
                desc: "Curated content library focused on biopsychosocial factors and central sensitization."
              },
              {
                icon: Shield,
                title: "Automated Assessments",
                desc: "Screen for yellow flags and fear-avoidance behaviors before the patient walks in."
              },
              {
                icon: Users,
                title: "Better Engagement",
                desc: "Send personalized education plans directly to your patient's inbox."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all" data-testid={`card-feature-${i}`}>
                <div className="w-12 h-12 bg-secondary/30 rounded-xl flex items-center justify-center text-primary mb-6">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3" data-testid={`title-feature-${i}`}>{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed" data-testid={`desc-feature-${i}`}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24" data-testid="section-pricing">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-primary rounded-3xl p-12 text-center text-white relative overflow-hidden" data-testid="card-pricing">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
            
            <h2 className="text-3xl font-serif font-bold mb-6 relative z-10" data-testid="heading-pricing">Start your 14-day free trial</h2>
            <div className="text-5xl font-bold mb-2 relative z-10" data-testid="text-price">$29<span className="text-xl font-normal opacity-80">/mo</span></div>
            <p className="text-primary-foreground/80 mb-8 relative z-10" data-testid="text-pricing-subtext">Cancel anytime. No hidden fees.</p>
            
            <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-10 text-left relative z-10">
              {['Unlimited Patients', 'Full Content Library', 'Custom Branding', 'Email Support'].map((item, i) => (
                <div key={item} className="flex items-center gap-2" data-testid={`pricing-feature-${i}`}>
                  <Check className="w-5 h-5 text-secondary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <Link href="/auth?signup=true">
              <Button size="lg" variant="secondary" className="h-12 px-12 rounded-full font-semibold relative z-10" data-testid="button-pricing-cta">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 border-t border-gray-200" data-testid="landing-footer">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary mb-4" data-testid="footer-logo">
                <Activity className="w-6 h-6" />
                <span>DriverPath</span>
              </div>
              <p className="text-sm text-muted-foreground" data-testid="footer-tagline">
                Evidence-based patient education for modern clinicians.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4" data-testid="footer-heading-product">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/features">
                    <span className="hover:text-foreground cursor-pointer" data-testid="footer-link-features">Features</span>
                  </Link>
                </li>
                <li>
                  <Link href="/auth?signup=true">
                    <span className="hover:text-foreground cursor-pointer" data-testid="footer-link-pricing">Pricing</span>
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4" data-testid="footer-heading-company">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about">
                    <span className="hover:text-foreground cursor-pointer" data-testid="footer-link-about">About Us</span>
                  </Link>
                </li>
                <li>
                  <Link href="/philosophy">
                    <span className="hover:text-foreground cursor-pointer" data-testid="footer-link-philosophy">Clinical Philosophy</span>
                  </Link>
                </li>
                <li>
                  <Link href="/blog">
                    <span className="hover:text-foreground cursor-pointer" data-testid="footer-link-blog">Blog</span>
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4" data-testid="footer-heading-resources">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/why-driverpath">
                    <span className="hover:text-foreground cursor-pointer" data-testid="footer-link-why">Why DriverPath</span>
                  </Link>
                </li>
                <li>
                  <Link href="/auth">
                    <span className="hover:text-foreground cursor-pointer" data-testid="footer-link-login">Provider Login</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-muted-foreground text-sm">
            <p data-testid="footer-copyright">&copy; 2025 DriverPath by Health Drivers Institute. All rights reserved.</p>
            <div className="pt-4">
              <Link href="/admin/login">
                <span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer" data-testid="footer-link-admin">Admin Access</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
