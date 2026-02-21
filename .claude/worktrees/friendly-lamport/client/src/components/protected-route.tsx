import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, useSubscriptionStatus } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/auth");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/auth");
    } else if (!loading && user && user.role !== "admin") {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}

export function RequireSubscription({ children }: { children: React.ReactNode }) {
  const { user, loading, refreshUser } = useAuth();
  const { isActive } = useSubscriptionStatus();
  const [, setLocation] = useLocation();

  const urlParams = new URLSearchParams(window.location.search);
  const isFromCheckoutUrl = urlParams.get("subscription") === "success";

  // Refresh user state if coming from checkout to catch the webhook update
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isFromCheckoutUrl && !isActive && !loading) {
      interval = setInterval(() => {
        refreshUser();
      }, 3000); // Poll every 3 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFromCheckoutUrl, isActive, loading, refreshUser]);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/auth");
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (!loading && user) {
      const isAdmin = user.role === "admin";
      // Only redirect if NOT active, NOT admin, AND not currently processing a success redirect
      if (!isActive && !isAdmin && !isFromCheckoutUrl) {
        setLocation("/subscription?reason=no_subscription");
      }
    }
  }, [user, loading, isActive, isFromCheckoutUrl, setLocation]);

  if (loading || (isFromCheckoutUrl && !isActive)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        {isFromCheckoutUrl && !isActive && (
          <p className="text-muted-foreground animate-pulse">Confirming your subscription...</p>
        )}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === "admin";
  if (!isActive && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
