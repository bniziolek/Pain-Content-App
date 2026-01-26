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
  const { user, loading } = useAuth();
  const { isActive } = useSubscriptionStatus();
  const [, setLocation] = useLocation();

  const urlParams = new URLSearchParams(window.location.search);
  const isFromCheckoutUrl = urlParams.get("subscription") === "success";
  
  if (isFromCheckoutUrl) {
    sessionStorage.setItem("checkout_pending", "true");
  }
  
  const hasCheckoutPending = sessionStorage.getItem("checkout_pending") === "true";
  
  if (isActive && hasCheckoutPending) {
    sessionStorage.removeItem("checkout_pending");
  }

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/auth");
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (!loading && user) {
      const isAdmin = user.role === "admin";
      if (!isActive && !isAdmin && !hasCheckoutPending) {
        setLocation("/subscription?reason=no_subscription");
      }
    }
  }, [user, loading, isActive, hasCheckoutPending, setLocation]);

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

  const isAdmin = user.role === "admin";
  if (!isActive && !isAdmin && !hasCheckoutPending) {
    return null;
  }

  return <>{children}</>;
}
