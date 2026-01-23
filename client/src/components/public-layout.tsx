import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const navLinks = [
  { href: "/about", label: "About", testId: "nav-about" },
  { href: "/philosophy", label: "Clinical Philosophy", testId: "nav-philosophy" },
  { href: "/features", label: "Features", testId: "nav-features" },
  { href: "/why-driverpath", label: "Why DriverPath", testId: "nav-why-driverpath" },
  { href: "/blog", label: "Blog", testId: "nav-blog" },
];

export function PublicLayout({ children }: PublicLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50" data-testid="public-nav">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary cursor-pointer" data-testid="link-logo">
                <Activity className="w-6 h-6" />
                <span>DriverPath</span>
              </div>
            </Link>
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    data-testid={link.testId}
                    className={`text-sm font-medium transition-colors cursor-pointer ${
                      location === link.href
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button variant="ghost" data-testid="button-login">Log In</Button>
            </Link>
            <Link href="/auth?signup=true">
              <Button data-testid="button-get-started">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="bg-gray-50 py-12 border-t border-gray-200" data-testid="public-footer">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary mb-4">
                <Activity className="w-6 h-6" />
                <span>DriverPath</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Evidence-based patient education for modern clinicians.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/features">
                    <span className="hover:text-foreground cursor-pointer" data-testid="footer-link-features">Features</span>
                  </Link>
                </li>
                <li>
                  <Link href="/subscription">
                    <span className="hover:text-foreground cursor-pointer" data-testid="footer-link-pricing">Pricing</span>
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about">
                    <span className="hover:text-foreground cursor-pointer" data-testid="footer-link-about">About Us</span>
                  </Link>
                </li>
                <li>
                  <Link href="/philosophy">
                    <span className="hover:text-foreground cursor-pointer" data-testid="footer-link-philosophy">
                      Clinical Philosophy
                    </span>
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
              <h4 className="font-semibold mb-4">Resources</h4>
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
            <p>&copy; 2025 DriverPath by Health Drivers Institute. All rights reserved.</p>
            <div className="pt-4">
              <Link href="/admin/login">
                <span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer" data-testid="footer-link-admin">
                  Admin Access
                </span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
