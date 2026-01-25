import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Library, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Menu,
  User,
  Activity,
  History,
  Users,
  ShieldCheck,
  Bell,
  Route,
  Sparkles,
  ToggleLeft,
  Crown,
  HeartPulse
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

const TIER_CONFIG: Record<string, { label: string; className: string; icon?: typeof Crown }> = {
  free: { label: "Free", className: "bg-gray-100 text-gray-600" },
  basic: { label: "Basic", className: "bg-blue-100 text-blue-600", icon: Sparkles },
  pro: { label: "Pro", className: "bg-amber-100 text-amber-600", icon: Crown },
  enterprise: { label: "Enterprise", className: "bg-purple-100 text-purple-600", icon: Crown },
};

function TierBadge({ tier }: { tier: string }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.basic;
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={cn("text-xs gap-1 font-medium", config.className)} data-testid="tier-badge">
      {Icon && <Icon className="w-3 h-3" />}
      {config.label}
    </Badge>
  );
}

function Sidebar({ className, onNavigate }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { data: featureFlags = {} } = useFeatureFlags();

  const isAdmin = user?.role === "admin";

  // Helper to check if a feature flag is enabled
  const isEnabled = (key: string) => featureFlags[key]?.isEnabled ?? false;

  // Admin gets different navigation
  const adminLinks = [
    { href: "/admin/dashboard", label: "Admin Dashboard", icon: ShieldCheck },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/health", label: "System Health", icon: HeartPulse },
    { href: "/assessments", label: "Assessments", icon: ClipboardList },
    { href: "/admin/recommendations", label: "Recommendation Rules", icon: Sparkles },
    { href: "/admin/feature-flags", label: "Feature Flags", icon: ToggleLeft },
    { href: "/library", label: "Content Oversight", icon: Library },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  // Clinician links - filtered based on feature flags
  const allClinicianLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tourId: "nav-dashboard", flagKey: null },
    { href: "/library", label: "Content Library", icon: Library, tourId: "nav-library", flagKey: null },
    { href: "/assessments", label: "Assessments", icon: ClipboardList, tourId: "nav-assessments", flagKey: "assessments_enabled" },
    { href: "/pathways", label: "Care Pathways", icon: Route, tourId: "nav-pathways", flagKey: "pathways_enabled" },
    { href: "/follow-ups", label: "Follow-ups", icon: Bell, tourId: "nav-followups", flagKey: "follow_ups_enabled" },
    { href: "/history", label: "History", icon: History, tourId: "nav-history", flagKey: "send_history_enabled" },
    { href: "/settings", label: "Settings", icon: Settings, tourId: "nav-settings", flagKey: null },
  ];

  // Filter clinician links based on feature flags
  const clinicianLinks = useMemo(() => {
    return allClinicianLinks.filter(link => {
      // Always show links without a flag requirement
      if (!link.flagKey) return true;
      // Only show links if their feature flag is enabled
      return isEnabled(link.flagKey);
    });
  }, [featureFlags]);

  const links = isAdmin ? adminLinks : clinicianLinks;

  return (
    <div className={cn("flex flex-col h-full bg-sidebar border-r border-sidebar-border", className)}>
      <div className="p-6">
        <div className="flex items-center gap-2 font-serif text-xl font-bold text-sidebar-primary">
          <Activity className="w-6 h-6" />
          <span>DriverPath</span>
        </div>
      </div>
      
      <div className="flex-1 px-4 py-2 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          const tourId = 'tourId' in link ? link.tourId : undefined;
          return (
            <Link key={link.href} href={link.href}>
              <div 
                onClick={onNavigate}
                data-tour={tourId}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </div>
            </Link>
          );
        })}
      </div>

      {!isAdmin && user?.subscriptionTier === 'basic' && (
        <div className="mx-4 mb-4 p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-900">Upgrade to Pro</span>
          </div>
          <p className="text-xs text-amber-700 mb-3">Unlock Care Pathways, Email Delivery & more</p>
          <Link href="/subscription?upgrade=true">
            <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs" data-testid="button-upgrade-sidebar">
              View Plans
            </Button>
          </Link>
        </div>
      )}

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-sidebar-foreground">{user?.name || user?.email}</span>
            {isAdmin ? (
              <span className="text-xs text-muted-foreground">Administrator</span>
            ) : (
              <TierBadge tier={user?.subscriptionTier || 'basic'} />
            )}
          </div>
        </div>
        <Button 
          onClick={async () => {
            await logout();
            navigate("/");
          }}
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-destructive" 
          size="sm"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { data: featureFlags = {} } = useFeatureFlags();
  
  const isAdmin = user?.role === "admin";
  const isEnabled = (key: string) => featureFlags[key]?.isEnabled ?? false;
  
  // Bottom nav shows only the most essential links for quick access
  const bottomLinks = isAdmin ? [
    { href: "/admin/dashboard", label: "Dashboard", icon: ShieldCheck },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/health", label: "Health", icon: HeartPulse },
    { href: "/library", label: "Content", icon: Library },
    { href: "/settings", label: "Settings", icon: Settings },
  ] : [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/library", label: "Library", icon: Library },
    ...(isEnabled("assessments_enabled") ? [{ href: "/assessments", label: "Assess", icon: ClipboardList }] : []),
    { href: "/history", label: "History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} data-testid="bottom-nav">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {bottomLinks.slice(0, 5).map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || location.startsWith(link.href + "/");
          return (
            <Link key={link.href} href={link.href}>
              <div className={cn(
                "flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1.5 rounded-xl transition-all touch-manipulation active:scale-95",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground active:bg-muted"
              )} data-testid={`nav-${link.label.toLowerCase()}`}>
                <Icon className={cn("mb-0.5", isActive ? "w-6 h-6" : "w-5 h-5")} />
                <span className={cn("font-medium", isActive ? "text-[11px]" : "text-[10px]")}>{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: featureFlags = {} } = useFeatureFlags();
  const { user } = useAuth();
  
  const isAdmin = user?.role === "admin";
  const isEnabled = (key: string) => featureFlags[key]?.isEnabled ?? false;
  
  const swipeRoutes = isAdmin
    ? ["/admin/dashboard", "/admin/users", "/admin/health", "/library", "/settings"]
    : [
        "/dashboard",
        "/library",
        ...(isEnabled("assessments_enabled") ? ["/assessments"] : []),
        "/history",
        "/settings",
      ];
  
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  
  useSwipeNavigation({
    routes: swipeRoutes,
    threshold: 100,
    enabled: isMobile,
  });

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Desktop Sidebar - only visible on large screens */}
      <div className="hidden lg:block w-64 h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile/Tablet Sidebar (hamburger menu) */}
      <div className="lg:hidden absolute top-3 left-3 z-50">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="min-w-[48px] min-h-[48px] shadow-md bg-background/95 backdrop-blur-sm border-2" data-testid="button-mobile-menu">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[85vw] max-w-[320px]">
            <Sidebar onNavigate={() => setIsMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto overflow-x-hidden">
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 pt-16 lg:pt-8 lg:px-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom Navigation for Mobile/Tablet */}
      <BottomNav />
    </div>
  );
}
