import { apiFetch } from './supabase.ts';
import {
  requestAppleHealthPermissions,
  fetchLatestAppleHealthPacket,
} from './appleHealth.ts';
import {
  requestGoogleFitPermissions,
  fetchLatestGoogleFitPacket,
} from './googleFit.ts';
import { Activity, HealthConnection, HealthSource } from '../types/index.ts';

export async function connectHealthProvider(
  source: HealthSource,
  action: 'connect' | 'disconnect',
  idToken?: string | null,
  demoAthleteId: string = 'athlete_alex'
): Promise<{ connection: HealthConnection }> {
  const permInfo =
    source === 'apple_health'
      ? await requestAppleHealthPermissions()
      : await requestGoogleFitPermissions();

  return apiFetch<{ connection: HealthConnection }>(
    '/api/health/connect',
    {
      method: 'POST',
      body: JSON.stringify({
        source,
        platform: source === 'apple_health' ? 'ios' : 'android',
        action,
        metadata: {
          device: permInfo.deviceModel,
          permissions: permInfo.permissions,
          autoSync: action === 'connect',
        },
      }),
    },
    idToken,
    demoAthleteId
  );
}

export async function syncNowFromWearable(
  source: HealthSource,
  idToken?: string | null,
  demoAthleteId: string = 'athlete_alex'
): Promise<{
  activity: Activity;
  connection: HealthConnection;
}> {
  const packet =
    source === 'apple_health'
      ? await fetchLatestAppleHealthPacket()
      : await fetchLatestGoogleFitPacket();

  return apiFetch<{ activity: Activity; connection: HealthConnection }>(
    '/api/health/sync',
    {
      method: 'POST',
      body: JSON.stringify(packet),
    },
    idToken,
    demoAthleteId
  );
}
