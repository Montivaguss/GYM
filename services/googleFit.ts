import { ActivityType } from '../types/index.ts';

export interface GoogleFitPermissionSet {
  scopes: string[];
}

export interface GoogleFitTelemetryPacket {
  externalId: string;
  source: 'google_fit';
  platform: 'android';
  deviceModel: string;
  type: ActivityType;
  durationMinutes: number;
  distanceKm: number;
  steps: number;
  calories: number;
  heartRateAvg: number;
  occurredAt: string;
  notes: string;
}

export const GOOGLE_FIT_SCOPES: GoogleFitPermissionSet = {
  scopes: [
    'android.permission.health.READ_STEPS',
    'android.permission.health.READ_DISTANCE',
    'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
    'android.permission.health.READ_HEART_RATE',
    'android.permission.health.READ_EXERCISE',
  ],
};

export async function requestGoogleFitPermissions(): Promise<{
  granted: boolean;
  permissions: string[];
  deviceModel: string;
}> {
  return {
    granted: true,
    permissions: GOOGLE_FIT_SCOPES.scopes,
    deviceModel: 'Pixel Watch 3 · Health Connect',
  };
}

export async function fetchLatestGoogleFitPacket(): Promise<GoogleFitTelemetryPacket> {
  const sampleWorkouts: Array<{
    type: ActivityType;
    durationMinutes: number;
    distanceKm: number;
    steps: number;
    calories: number;
    heartRateAvg: number;
    notes: string;
  }> = [
    {
      type: 'Run',
      durationMinutes: 38,
      distanceKm: 6.9,
      steps: 8480,
      calories: 470,
      heartRateAvg: 154,
      notes: 'Auto-synced progression run via Android Health Connect (Pixel Watch 3).',
    },
    {
      type: 'Gym workout',
      durationMinutes: 50,
      distanceKm: 0.8,
      steps: 4120,
      calories: 430,
      heartRateAvg: 136,
      notes: 'Auto-synced strength & metabolic circuit via Google Fit / Health Connect.',
    },
    {
      type: 'Walk',
      durationMinutes: 40,
      distanceKm: 3.4,
      steps: 4450,
      calories: 215,
      heartRateAvg: 116,
      notes: 'Auto-synced brisk afternoon walk via Health Connect.',
    },
  ];

  const chosen = sampleWorkouts[Math.floor(Math.random() * sampleWorkouts.length)];

  return {
    externalId: `gfit_${Date.now()}`,
    source: 'google_fit',
    platform: 'android',
    deviceModel: 'Pixel Watch 3 · Health Connect',
    ...chosen,
    occurredAt: new Date().toISOString(),
  };
}
