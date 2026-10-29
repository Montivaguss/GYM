import { useCallback, useState } from 'react';
import { Activity, HealthConnection, HealthSource } from '../types/index.ts';
import { syncNowFromWearable } from '../services/healthSync.ts';

interface UseHealthSyncOptions {
  activeUserId: string;
  idToken?: string | null;
  connections: HealthConnection[];
  onSyncCompleted?: () => Promise<void>;
}

export function useHealthSync({
  activeUserId,
  idToken,
  connections,
  onSyncCompleted,
}: UseHealthSyncOptions) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    activity: Activity;
    connection: HealthConnection;
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const activeConnection =
    connections.find((c) => c.status === 'connected') || connections[0] || null;

  const triggerSync = useCallback(
    async (sourceOverride?: HealthSource) => {
      const targetSource: HealthSource =
        sourceOverride || activeConnection?.source || 'apple_health';
      setIsSyncing(true);
      setSyncError(null);
      try {
        const result = await syncNowFromWearable(
          targetSource,
          idToken,
          activeUserId
        );
        setLastSyncResult(result);
        if (onSyncCompleted) {
          await onSyncCompleted();
        }
        return result;
      } catch (err: any) {
        const msg = err?.message || 'Unable to sync wearable health data.';
        setSyncError(msg);
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [activeConnection, activeUserId, idToken, onSyncCompleted]
  );

  return {
    activeConnection,
    isSyncing,
    lastSyncResult,
    syncError,
    triggerSync,
  };
}
