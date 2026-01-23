import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

type FeatureFlagMap = Record<string, { isEnabled: boolean; value: string | null }>;

// Tier entitlement matrix - matches server-side TIER_ENTITLEMENTS
const TIER_ENTITLEMENTS: Record<string, string[]> = {
  content_library: ['basic', 'pro', 'enterprise'],
  content_concierge: ['basic', 'pro', 'enterprise'],
  content_packets: ['basic', 'pro', 'enterprise'],
  internal_screenings: ['basic', 'pro', 'enterprise'],
  assessment_builder: ['basic', 'pro', 'enterprise'],
  patient_portal: ['pro', 'enterprise'],
  email_delivery: ['pro', 'enterprise'],
  care_pathways: ['pro', 'enterprise'],
  follow_up_automation: ['pro', 'enterprise'],
  priority_support: ['pro', 'enterprise'],
  custom_branding: ['pro', 'enterprise'],
  white_label: ['enterprise'],
  api_access: ['enterprise'],
  sso: ['enterprise'],
};

const TIER_LEVELS: Record<string, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  enterprise: 3,
};

export function useFeatureFlags() {
  return useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const res = await fetch("/api/feature-flags", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch feature flags");
      return res.json() as Promise<FeatureFlagMap>;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useFeatureFlag(key: string) {
  const { data: flags = {}, isLoading, error } = useFeatureFlags();
  const flag = flags[key];
  
  return {
    isEnabled: flag?.isEnabled ?? false,
    value: flag?.value ?? null,
    isLoading,
    error,
  };
}

export function useContentDeliveryMode() {
  const { data: flags = {}, isLoading } = useFeatureFlags();
  
  const contentDeliveryMode = flags["content_delivery_mode"];
  const patientMessaging = flags["patient_messaging_enabled"];
  
  // If patient messaging is disabled, force packet mode regardless of content_delivery_mode setting
  const isPatientMessagingEnabled = patientMessaging?.isEnabled ?? false;
  
  // Email mode: content_delivery_mode is enabled AND patient messaging is enabled
  const isEmailMode = isPatientMessagingEnabled && (contentDeliveryMode?.isEnabled ?? false);
  
  // Packet mode: content_delivery_mode is disabled OR patient messaging is disabled
  const isPacketMode = !isPatientMessagingEnabled || !(contentDeliveryMode?.isEnabled ?? false);
  
  return {
    isEmailMode,
    isPacketMode,
    isLoading,
  };
}

// Convenience hooks for common feature flags
export function usePatientFeatures() {
  const { data: flags = {}, isLoading } = useFeatureFlags();
  
  return {
    patientPortalEnabled: flags["patient_portal_enabled"]?.isEnabled ?? false,
    patientMessagingEnabled: flags["patient_messaging_enabled"]?.isEnabled ?? false,
    patientAssessmentsEnabled: flags["patient_assessments_enabled"]?.isEnabled ?? false,
    followUpsEnabled: flags["follow_ups_enabled"]?.isEnabled ?? false,
    pathwaysEnabled: flags["pathways_enabled"]?.isEnabled ?? false,
    sendHistoryEnabled: flags["send_history_enabled"]?.isEnabled ?? false,
    assessmentsEnabled: flags["assessments_enabled"]?.isEnabled ?? false,
    isLoading,
  };
}

// Hook for checking tier-based feature access
export function useTierEntitlement(featureKey: string) {
  const { user } = useAuth();
  const userTier = user?.subscriptionTier || 'basic';
  const userTierLevel = TIER_LEVELS[userTier] || 0;
  const allowedTiers = TIER_ENTITLEMENTS[featureKey] || [];
  
  const hasAccess = allowedTiers.includes(userTier);
  const minRequiredTier = allowedTiers.reduce((min, tier) => {
    const level = TIER_LEVELS[tier] || 99;
    return level < (TIER_LEVELS[min] || 99) ? tier : min;
  }, allowedTiers[0] || 'pro');
  
  return {
    hasAccess,
    needsUpgrade: !hasAccess,
    currentTier: userTier,
    requiredTier: minRequiredTier as "basic" | "pro",
    isActive: user?.subscriptionStatus === 'active',
  };
}

// Hook for checking multiple tier entitlements at once
export function useTierEntitlements() {
  const { user } = useAuth();
  const userTier = user?.subscriptionTier || 'basic';
  const isActive = user?.subscriptionStatus === 'active';
  
  const checkAccess = (featureKey: string): boolean => {
    const allowedTiers = TIER_ENTITLEMENTS[featureKey] || [];
    return allowedTiers.includes(userTier);
  };
  
  return {
    currentTier: userTier,
    isActive,
    checkAccess,
    // Quick access for common Pro features
    hasPatientPortal: checkAccess('patient_portal'),
    hasEmailDelivery: checkAccess('email_delivery'),
    hasCarePathways: checkAccess('care_pathways'),
    hasFollowUpAutomation: checkAccess('follow_up_automation'),
    hasPrioritySupport: checkAccess('priority_support'),
  };
}
