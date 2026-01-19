import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";

interface SwipeNavigationOptions {
  routes: string[];
  threshold?: number;
  enabled?: boolean;
}

export function useSwipeNavigation({
  routes,
  threshold = 100,
  enabled = true,
}: SwipeNavigationOptions) {
  const [location, navigate] = useLocation();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);

  const getCurrentIndex = useCallback(() => {
    return routes.findIndex((route) => location === route || location.startsWith(route + "/"));
  }, [routes, location]);

  const handleSwipe = useCallback(() => {
    if (!enabled) return;

    const diffX = touchStartX.current - touchEndX.current;
    const currentIndex = getCurrentIndex();

    if (currentIndex === -1) return;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && currentIndex < routes.length - 1) {
        navigate(routes[currentIndex + 1]);
      } else if (diffX < 0 && currentIndex > 0) {
        navigate(routes[currentIndex - 1]);
      }
    }
  }, [enabled, threshold, getCurrentIndex, routes, navigate]);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const diffY = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
      const diffX = Math.abs(touchStartX.current - touchEndX.current);
      
      if (diffX > diffY * 2 && diffX > threshold / 2) {
        handleSwipe();
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleSwipe, threshold]);

  return {
    currentIndex: getCurrentIndex(),
    totalRoutes: routes.length,
  };
}
