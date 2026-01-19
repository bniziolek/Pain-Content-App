import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface OfflineAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
}

const CACHE_KEY_PREFIX = "driverpath_cache_";
const ACTIONS_QUEUE_KEY = "driverpath_offline_actions";
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useOfflineCache() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const stored = localStorage.getItem(ACTIONS_QUEUE_KEY);
    if (stored) {
      try {
        setPendingActions(JSON.parse(stored));
      } catch {
        setPendingActions([]);
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(ACTIONS_QUEUE_KEY, JSON.stringify(pendingActions));
  }, [pendingActions]);

  const cacheData = useCallback((key: string, data: unknown) => {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + CACHE_EXPIRY_MS,
      };
      localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(cacheEntry));
    } catch (e) {
      console.warn("Failed to cache data:", e);
    }
  }, []);

  const getCachedData = useCallback(<T,>(key: string): T | null => {
    try {
      const stored = localStorage.getItem(CACHE_KEY_PREFIX + key);
      if (!stored) return null;

      const entry = JSON.parse(stored);
      if (entry.expiry < Date.now()) {
        localStorage.removeItem(CACHE_KEY_PREFIX + key);
        return null;
      }

      return entry.data as T;
    } catch {
      return null;
    }
  }, []);

  const clearCache = useCallback((key?: string) => {
    if (key) {
      localStorage.removeItem(CACHE_KEY_PREFIX + key);
    } else {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(CACHE_KEY_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    }
  }, []);

  const queueAction = useCallback((type: string, payload: unknown) => {
    const action: OfflineAction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
    };
    setPendingActions((prev) => [...prev, action]);
    return action.id;
  }, []);

  const removeAction = useCallback((id: string) => {
    setPendingActions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const syncPendingActions = useCallback(
    async (
      processor: (action: OfflineAction) => Promise<boolean>
    ): Promise<{ success: number; failed: number }> => {
      if (!isOnline || pendingActions.length === 0) {
        return { success: 0, failed: 0 };
      }

      setIsSyncing(true);
      let success = 0;
      let failed = 0;

      const actionsToProcess = [...pendingActions];

      for (const action of actionsToProcess) {
        try {
          const result = await processor(action);
          if (result) {
            removeAction(action.id);
            success++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      setIsSyncing(false);
      
      queryClient.invalidateQueries();

      return { success, failed };
    },
    [isOnline, pendingActions, removeAction, queryClient]
  );

  return {
    isOnline,
    isSyncing,
    pendingActions,
    pendingCount: pendingActions.length,
    cacheData,
    getCachedData,
    clearCache,
    queueAction,
    removeAction,
    syncPendingActions,
  };
}

export function useContentCache() {
  const { cacheData, getCachedData, isOnline } = useOfflineCache();

  const cacheContent = useCallback(
    (content: unknown[]) => {
      cacheData("content_library", content);
    },
    [cacheData]
  );

  const getCachedContent = useCallback(<T,>(): T[] | null => {
    return getCachedData<T[]>("content_library");
  }, [getCachedData]);

  return {
    isOnline,
    cacheContent,
    getCachedContent,
  };
}
