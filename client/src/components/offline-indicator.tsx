import { useState, useEffect } from "react";
import { WifiOff, Wifi, CloudOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfflineIndicatorProps {
  pendingCount?: number;
  isSyncing?: boolean;
}

export function OfflineIndicator({ pendingCount = 0, isSyncing = false }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const showBanner = !isOnline || showReconnected || isSyncing;

  if (!showBanner && pendingCount === 0) {
    return null;
  }

  if (!showBanner && pendingCount > 0) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-[100] px-4 py-1.5 text-center text-xs font-medium bg-blue-500 text-white"
        data-testid="pending-actions-indicator"
      >
        <div className="flex items-center justify-center gap-2">
          <CloudOff className="w-3 h-3" />
          <span>{pendingCount} action{pendingCount !== 1 ? 's' : ''} pending sync</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-center text-sm font-medium transition-all duration-300",
        isSyncing
          ? "bg-blue-500 text-white"
          : isOnline
          ? "bg-green-500 text-white"
          : "bg-amber-500 text-white"
      )}
      data-testid="offline-indicator"
    >
      <div className="flex items-center justify-center gap-2">
        {isSyncing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Syncing pending actions...</span>
          </>
        ) : isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Back online{pendingCount > 0 ? ` - syncing ${pendingCount} action${pendingCount !== 1 ? 's' : ''}` : ''}</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You're offline{pendingCount > 0 ? ` (${pendingCount} pending)` : '. Some features may be unavailable.'}</span>
          </>
        )}
      </div>
    </div>
  );
}
