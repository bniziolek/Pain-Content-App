import { useOffline } from "@/contexts/offline-context";
import { OfflineIndicator } from "@/components/offline-indicator";

export function ConnectedOfflineIndicator() {
  const { pendingCount, isSyncing } = useOffline();
  
  return <OfflineIndicator pendingCount={pendingCount} isSyncing={isSyncing} />;
}
