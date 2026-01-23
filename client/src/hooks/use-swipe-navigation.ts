import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";

interface SwipeNavigationOptions {
  routes: string[];
  threshold?: number;
  enabled?: boolean;
}

const INTERACTIVE_SELECTORS = [
  'a', 'button', 'input', 'textarea', 'select',
  '[role="button"]', '[role="link"]', '[onclick]',
  '[data-testid*="card"]', '[data-testid*="button"]', '[data-testid*="link"]',
  '.card', '.btn', '[tabindex]:not([tabindex="-1"])'
].join(',');

function isInteractiveElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof Element)) return false;
  return element.closest(INTERACTIVE_SELECTORS) !== null;
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
  const touchStartTime = useRef(0);
  const touchStartTarget = useRef<EventTarget | null>(null);

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
      // Initialize touchEndX to touchStartX so that taps without touchmove events result in diffX = 0
      touchEndX.current = e.touches[0].clientX;
      touchStartTime.current = Date.now();
      touchStartTarget.current = e.target;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const diffY = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
      const diffX = Math.abs(touchStartX.current - touchEndX.current);
      const touchDuration = Date.now() - touchStartTime.current;
      
      // Don't trigger swipe navigation if:
      // 1. Touch started on an interactive element (links, buttons, cards, etc.)
      // 2. Touch was too short (likely a tap, not a swipe) - require at least 200ms for better accessibility
      // 3. Horizontal movement isn't significantly greater than vertical
      // 4. Horizontal movement doesn't exceed the threshold
      if (isInteractiveElement(touchStartTarget.current)) {
        return;
      }
      
      if (touchDuration < 200) {
        return;
      }
      
      if (diffX > diffY * 2 && diffX > threshold) {
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
