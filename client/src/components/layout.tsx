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
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

function Sidebar({ className, onNavigate }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "admin";

  // Admin gets different navigation
  const adminLinks = [
    { href: "/admin/dashboard", label: "Admin Dashboard", icon: ShieldCheck },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/library", label: "Content Oversight", icon: Library },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const clinicianLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tourId: "nav-dashboard" },
    { href: "/library", label: "Content Library", icon: Library, tourId: "nav-library" },
    { href: "/assessments", label: "Assessments", icon: ClipboardList, tourId: "nav-assessments" },
    { href: "/pathways", label: "Care Pathways", icon: Route, tourId: "nav-pathways" },
    { href: "/recommendation-rules", label: "Recommendations", icon: Sparkles, tourId: "nav-recommendations" },
    { href: "/follow-ups", label: "Follow-ups", icon: Bell, tourId: "nav-followups" },
    { href: "/history", label: "Send History", icon: History, tourId: "nav-history" },
    { href: "/settings", label: "Settings", icon: Settings, tourId: "nav-settings" },
  ];

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
                    ? "bg-sidebar-accent text-sidebar-primary-foreground font-semibold" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
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
            <span className="text-xs text-muted-foreground">
              {isAdmin ? "Administrator" : "Pro Plan"}
            </span>
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
