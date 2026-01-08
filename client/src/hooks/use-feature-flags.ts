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
  const { isEnabled, value, isLoading } = useFeatureFlag("content_delivery_mode");
  
  return {
    isEmailMode: !isEnabled || value === "email",
    isPacketMode: isEnabled && value === "packet",
    isLoading,
  };
}
