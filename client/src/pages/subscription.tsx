import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Check, Crown, Loader2, Settings, Sparkles, X, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Price {
  id: string;
  unitAmount: number;
  currency: string;
  recurring: { interval: string; interval_count: number } | null;
  metadata: Record<string, string>;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  prices: Price[];
}

interface FeatureFlag {
  key: string;
  isEnabled: boolean;
}

const TIER_FEATURES = {
  basic: [
    { name: "Content Library Access", included: true },
    { name: "Content Concierge", included: true },
    { name: "Content Packets", included: true },
    { name: "Internal Screenings", included: true },
    { name: "Limited Assessments", included: true },
    { name: "Patient Portal", included: false },
    { name: "Email Delivery", included: false },
    { name: "Care Pathways", included: false },
    { name: "Follow-up Automation", included: false },
    { name: "Priority Support", included: false },
  ],
  pro: [
    { name: "Content Library Access", included: true },
    { name: "Content Concierge", included: true },
    { name: "Content Packets", included: true },
    { name: "Internal Screenings", included: true },
    { name: "Unlimited Assessments", included: true },
    { name: "Patient Portal", included: true },
    { name: "Email Delivery", included: true },
    { name: "Care Pathways", included: true },
    { name: "Follow-up Automation", included: true },
    { name: "Priority Support", included: true },
  ],
};

export default function SubscriptionPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [proTierEnabled, setProTierEnabled] = useState(true);

  useEffect(() => {
    fetchPlans();
    fetchFeatureFlags();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/subscription/plans", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchFeatureFlags = async () => {
    try {
      const res = await fetch("/api/subscription/feature-flags", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const proFlag = data.flags?.find((f: FeatureFlag) => f.key === "pro_tier_enabled");
        if (proFlag) {
          setProTierEnabled(proFlag.isEnabled);
        }
      }
    } catch (error) {
      console.error("Failed to fetch feature flags:", error);
    }
  };

  const handleCheckout = async (priceId: string, tier: string) => {
    setCheckoutLoading(priceId);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ priceId, tier }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create checkout session");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleUpgrade = async (priceId: string, tier: string) => {
    setCheckoutLoading(priceId);
    try {
      const res = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ priceId, tier }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to upgrade subscription");
      }

      const data = await res.json();
      if (data.success) {
        toast({
          title: "Upgrade Successful!",
          description: `Your subscription has been upgraded to ${tier.charAt(0).toUpperCase() + tier.slice(1)}.`,
        });
        // Refresh user data to get the new tier
        await refreshUser();
        setLocation("/dashboard?subscription=upgraded");
      }
    } catch (error: any) {
      toast({
        title: "Upgrade Error",
        description: error.message || "Failed to upgrade subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subscription/portal", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to access billing portal");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPrice = (plan: Plan, interval: "month" | "year") => {
    return plan.prices.find((p) => p.recurring?.interval === interval);
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const basicPlan = plans.find((p) => p.metadata?.tier === "basic");
  const proPlan = plans.find((p) => p.metadata?.tier === "pro");

  const isSubscribed = user?.subscriptionStatus === "active" || user?.subscriptionStatus === "trialing";
  const currentTier = isSubscribed ? (user?.subscriptionTier || "basic") : "free";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <div className="w-full max-w-5xl space-y-8 py-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 font-serif text-2xl font-bold text-primary">
            <Activity className="w-8 h-8" />
            <span>DriverPath</span>
          </div>
          <h1 className="text-3xl font-serif font-bold">
            {isSubscribed ? "Manage Your Subscription" : "Choose Your Plan"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {isSubscribed
              ? "View your current plan or make changes to your subscription."
              : "Select the plan that best fits your practice. Upgrade or downgrade anytime."}
          </p>
        </div>

        {isSubscribed && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {currentTier === "pro" ? (
                    <Crown className="w-6 h-6 text-primary" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg capitalize">{currentTier} Plan</h3>
                    <Badge variant="secondary" className="capitalize">
                      {user?.subscriptionStatus}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {user?.subscriptionStatus === "trialing"
                      ? "Your trial is active"
                      : "Your subscription is active"}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleManageSubscription} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Settings className="w-4 h-4 mr-2" />
                )}
                Manage Billing
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Tabs
            value={billingInterval}
            onValueChange={(v) => setBillingInterval(v as "month" | "year")}
            className="w-fit"
          >
            <TabsList>
              <TabsTrigger value="month" data-testid="tab-monthly">
                Monthly
              </TabsTrigger>
              <TabsTrigger value="year" data-testid="tab-annual">
                Annual
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                  Save 17%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loadingPlans ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className={`grid gap-8 ${proTierEnabled ? "md:grid-cols-2" : "md:grid-cols-1 max-w-lg mx-auto"}`}>
            <Card
              className={`relative transition-all border-2 ${
                currentTier === "basic" ? "border-primary shadow-lg" : "border-gray-200"
              }`}
            >
              {currentTier === "basic" && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Current Plan</Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  Basic
                </CardTitle>
                <CardDescription>
                  Essential tools for solo practitioners getting started with evidence-based education.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {basicPlan ? (
                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      {formatPrice(
                        getPrice(basicPlan, billingInterval)?.unitAmount || 1900,
                        getPrice(basicPlan, billingInterval)?.currency || "usd"
                      )}
                    </span>
                    <span className="text-lg text-muted-foreground">
                      /{billingInterval === "year" ? "year" : "mo"}
                    </span>
                    {billingInterval === "year" && (
                      <p className="text-sm text-green-600 mt-1">
                        That's {formatPrice(Math.round((getPrice(basicPlan, "year")?.unitAmount || 19000) / 12), "usd")}/mo billed annually
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mb-6">
                    <span className="text-4xl font-bold">$19</span>
                    <span className="text-lg text-muted-foreground">/mo</span>
                  </div>
                )}
                <ul className="space-y-3">
                  {TIER_FEATURES.basic.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={feature.included ? "" : "text-muted-foreground"}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {currentTier === "basic" ? (
                  <Button className="w-full" variant="outline" disabled>
                    Current Plan
                  </Button>
                ) : currentTier === "pro" ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleManageSubscription}
                    disabled={isLoading}
                    data-testid="button-downgrade-basic"
                  >
                    Downgrade to Basic
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => {
                      const price = getPrice(basicPlan!, billingInterval);
                      if (price) handleCheckout(price.id, "basic");
                    }}
                    disabled={!basicPlan || checkoutLoading !== null}
                    data-testid="button-subscribe-basic"
                  >
                    {checkoutLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Get Started
                  </Button>
                )}
              </CardFooter>
            </Card>

            {proTierEnabled && (
              <Card
                className={`relative transition-all border-2 ${
                  currentTier === "pro" ? "border-primary shadow-lg" : "border-amber-200 shadow-md"
                }`}
              >
                {currentTier === "pro" ? (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Current Plan</Badge>
                ) : (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    Pro
                  </CardTitle>
                  <CardDescription>
                    Complete toolkit for practices ready to scale with full patient engagement features.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {proPlan ? (
                    <div className="mb-6">
                      <span className="text-4xl font-bold">
                        {formatPrice(
                          getPrice(proPlan, billingInterval)?.unitAmount || 2900,
                          getPrice(proPlan, billingInterval)?.currency || "usd"
                        )}
                      </span>
                      <span className="text-lg text-muted-foreground">
                        /{billingInterval === "year" ? "year" : "mo"}
                      </span>
                      {billingInterval === "year" && (
                        <p className="text-sm text-green-600 mt-1">
                          That's {formatPrice(Math.round((getPrice(proPlan, "year")?.unitAmount || 29000) / 12), "usd")}/mo billed annually
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mb-6">
                      <span className="text-4xl font-bold">$29</span>
                      <span className="text-lg text-muted-foreground">/mo</span>
                    </div>
                  )}
                  <ul className="space-y-3">
                    {TIER_FEATURES.pro.map((feature) => (
                      <li key={feature.name} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature.name}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {currentTier === "pro" ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : currentTier === "basic" && user?.stripeSubscriptionId ? (
                    <Button
                      className="w-full bg-amber-500 hover:bg-amber-600"
                      onClick={() => {
                        const price = getPrice(proPlan!, billingInterval);
                        if (price) handleUpgrade(price.id, "pro");
                      }}
                      disabled={!proPlan || checkoutLoading !== null}
                      data-testid="button-upgrade-pro"
                    >
                      {checkoutLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Upgrade to Pro
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-amber-500 hover:bg-amber-600"
                      onClick={() => {
                        const price = getPrice(proPlan!, billingInterval);
                        if (price) handleCheckout(price.id, "pro");
                      }}
                      disabled={!proPlan || checkoutLoading !== null}
                      data-testid="button-subscribe-pro"
                    >
                      {checkoutLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Get Started
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}
          </div>
        )}

        <div className="text-center space-y-4 pt-8">
          <p className="text-sm text-muted-foreground">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              ← Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
