import { RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const { containerRef, isRefreshing, pullDistance, pullProgress } = usePullToRefresh({
    onRefresh,
    threshold: 80,
  });

  return (
    <div ref={containerRef} className={cn("relative overflow-auto", className)}>
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-opacity duration-200 z-10"
        style={{
          top: Math.max(0, pullDistance - 40),
          opacity: pullProgress,
        }}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center",
            isRefreshing && "animate-pulse"
          )}
        >
          <RefreshCw
            className={cn(
              "w-5 h-5 text-primary transition-transform duration-200",
              isRefreshing && "animate-spin"
            )}
            style={{
              transform: isRefreshing ? undefined : `rotate(${pullProgress * 360}deg)`,
            }}
          />
        </div>
      </div>
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? "transform 0.2s ease-out" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
