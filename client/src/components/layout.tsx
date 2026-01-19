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
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { useFeatureFlags } from "@/hooks/use-feature-flags";

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

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 h-full">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar onNavigate={() => setIsMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container max-w-6xl mx-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
