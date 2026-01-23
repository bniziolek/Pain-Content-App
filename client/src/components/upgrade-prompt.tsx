import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UpgradePromptProps {
  feature: string;
  requiredTier: "basic" | "pro";
  currentTier?: string;
  variant?: "card" | "inline" | "dialog" | "banner" | "sidebar";
  open?: boolean;
  onClose?: () => void;
  className?: string;
}

const TIER_DISPLAY = {
  basic: {
    icon: Sparkles,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    price: "$19/mo",
  },
  pro: {
    icon: Crown,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    price: "$29/mo",
  },
};

export function UpgradePrompt({
  feature,
  requiredTier,
  currentTier = "free",
  variant = "card",
  open,
  onClose,
  className = "",
}: UpgradePromptProps) {
  const tierInfo = TIER_DISPLAY[requiredTier];
  const TierIcon = tierInfo.icon;

  const content = (
    <div className="space-y-4">
      <div className={`w-16 h-16 rounded-full ${tierInfo.bgColor} flex items-center justify-center mx-auto`}>
        <Lock className={`w-8 h-8 ${tierInfo.color}`} />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">{feature} requires {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}</h3>
        <p className="text-muted-foreground text-sm">
          Upgrade to {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} to unlock this feature and more.
        </p>
      </div>
      <div className="flex items-center justify-center gap-2">
        <Badge variant="outline" className={`${tierInfo.color} border-current`}>
          <TierIcon className="w-3 h-3 mr-1" />
          {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} - {tierInfo.price}
        </Badge>
      </div>
      <Link href="/subscription">
        <Button className="w-full" data-testid="button-upgrade-now">
          View Plans & Upgrade
        </Button>
      </Link>
    </div>
  );

  if (variant === "dialog") {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Upgrade Required</DialogTitle>
            <DialogDescription className="sr-only">
              This feature requires a higher subscription tier.
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  if (variant === "inline") {
    const borderClass = requiredTier === "pro" ? "border-amber-200" : "border-blue-200";
    return (
      <div className={`p-4 rounded-lg border ${tierInfo.bgColor} ${borderClass} ${className}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center`}>
            <Lock className={`w-5 h-5 ${tierInfo.color}`} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{feature} is a {requiredTier} feature</p>
            <p className="text-xs text-muted-foreground">Upgrade to access this and more</p>
          </div>
          <Link href="/subscription">
            <Button size="sm" variant="outline" data-testid="button-upgrade-inline">
              Upgrade
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className={`bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-full">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-900">Unlock {feature} with Pro</p>
              <p className="text-sm text-amber-700">Get more powerful features for your practice</p>
            </div>
          </div>
          <Link href="/subscription?upgrade=true">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" data-testid="button-upgrade-banner">
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className={`mx-4 mb-4 p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-900">Upgrade to Pro</span>
        </div>
        <p className="text-xs text-amber-700 mb-3">Unlock {feature} and more premium features</p>
        <Link href="/subscription?upgrade=true">
          <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs" data-testid="button-upgrade-sidebar">
            View Plans
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center pb-2">
        <div className={`w-12 h-12 rounded-full ${tierInfo.bgColor} flex items-center justify-center mx-auto mb-2`}>
          <Lock className={`w-6 h-6 ${tierInfo.color}`} />
        </div>
        <CardTitle className="text-lg">Upgrade to {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}</CardTitle>
        <CardDescription>
          {feature} requires a {requiredTier} subscription
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <TierIcon className={`w-4 h-4 ${tierInfo.color}`} />
          <span className="text-sm font-medium">{tierInfo.price}</span>
        </div>
        <Link href="/subscription">
          <Button className="w-full" data-testid="button-upgrade-card">
            View Plans
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function useUpgradeCheck(requiredTier: "basic" | "pro", currentTier?: string) {
  const tierLevels: Record<string, number> = {
    free: 0,
    basic: 1,
    pro: 2,
    enterprise: 3,
  };

  const current = tierLevels[currentTier || "free"] || 0;
  const required = tierLevels[requiredTier] || 0;

  return {
    hasAccess: current >= required,
    needsUpgrade: current < required,
    requiredTier,
    currentTier: currentTier || "free",
  };
}
