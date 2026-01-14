import { useQuery } from "@tanstack/react-query";

type FeatureFlagMap = Record<string, { isEnabled: boolean; value: string | null }>;

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
  
  // Email mode only available if patient messaging is enabled AND content_delivery_mode is email
  const isEmailMode = isPatientMessagingEnabled && 
    (!contentDeliveryMode?.isEnabled || contentDeliveryMode?.value === "email");
  
  // Packet mode if patient messaging is disabled OR content_delivery_mode is packet
  const isPacketMode = !isPatientMessagingEnabled || 
    (contentDeliveryMode?.isEnabled && contentDeliveryMode?.value === "packet");
  
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
    isLoading,
  };
}
