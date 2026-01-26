import { useEffect, useState } from "react";
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
  const [isWaitingForSubscription, setIsWaitingForSubscription] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const urlParams = new URLSearchParams(window.location.search);
  const isFromCheckout = urlParams.get("subscription") === "success";

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/auth");
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (!loading && user && !isActive && isFromCheckout && pollCount < 10) {
      setIsWaitingForSubscription(true);
      const timer = setTimeout(async () => {
        await refreshUser();
        setPollCount((c) => c + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
    
    if (!loading && user && isActive && isFromCheckout) {
      setIsWaitingForSubscription(false);
    }
  }, [loading, user, isActive, isFromCheckout, pollCount, refreshUser]);

  useEffect(() => {
    if (!loading && user && !isWaitingForSubscription) {
      const isAdmin = user.role === "admin";
      if (!isActive && !isAdmin && !isFromCheckout) {
        setLocation("/subscription?reason=no_subscription");
      } else if (!isActive && !isAdmin && isFromCheckout && pollCount >= 10) {
        setLocation("/subscription?reason=checkout_pending");
      }
    }
  }, [user, loading, isActive, isWaitingForSubscription, isFromCheckout, pollCount, setLocation]);

  if (loading || isWaitingForSubscription) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        {isWaitingForSubscription && (
          <p className="text-muted-foreground">Activating your subscription...</p>
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
