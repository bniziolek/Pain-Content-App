import { createContext, useContext, ReactNode } from "react";
import { useOfflineCache } from "@/hooks/use-offline-cache";

interface OfflineContextValue {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  cacheData: (key: string, data: unknown) => void;
  getCachedData: <T>(key: string) => T | null;
  queueAction: (type: string, payload: unknown) => string;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const offlineState = useOfflineCache();

  return (
    <OfflineContext.Provider value={offlineState}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline must be used within OfflineProvider");
  }
  return context;
}
