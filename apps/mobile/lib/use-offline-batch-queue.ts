import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import {
  countQueuedBatchCreates,
  flushBatchCreateQueue
} from "./offline-queue";

const FLUSH_INTERVAL_MS = 15_000;

export function useOfflineBatchQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isFlushing, setIsFlushing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    setPendingCount(await countQueuedBatchCreates());
  }, []);

  const flush = useCallback(async () => {
    setIsFlushing(true);

    try {
      await flushBatchCreateQueue();
      await refreshPendingCount();
    } finally {
      setIsFlushing(false);
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    void refreshPendingCount();
    void flush();

    const interval = setInterval(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void flush();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [flush, refreshPendingCount]);

  return {
    flush,
    isFlushing,
    pendingCount,
    refreshPendingCount
  };
}
