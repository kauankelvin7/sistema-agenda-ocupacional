
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseAutoRefreshOptions {
  queryKeys: string[][];
  intervalMs?: number;
  enabled?: boolean;
}

export const useAutoRefresh = ({ 
  queryKeys, 
  intervalMs = 5000, 
  enabled = true 
}: UseAutoRefreshOptions) => {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      queryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [queryClient, queryKeys, intervalMs, enabled]);

  return {
    forceRefresh: () => {
      queryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
    }
  };
};
