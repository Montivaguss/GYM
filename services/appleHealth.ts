import { ActivityType } from '../types/index.ts';

export interface AppleHealthPermissionSet {
  read: string[];
  write: string[];
}

export interface AppleHealthTelemetryPacket {
  externalId: string;
  source: 'apple_health';
  platform: 'ios';
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

export const APPLE_HEALTH_PERMISSIONS: AppleHealthPermissionSet = {
  read: [
    'HKQuantityTypeIdentifierStepCount',
    'HKQuantityTypeIdentifierDistanceWalkingRunning',
    'HKQuantityTypeIdentifierActiveEnergyBurned',
    'HKQuantityTypeIdentifierHeartRate',
    'HKWorkoutTypeIdentifier',
  ],
  write: [
    'HKQuantityTypeIdentifierStepCount',
    'HKQuantityTypeIdentifierActiveEnergyBurned',
    'HKWorkoutTypeIdentifier',
  ],
};

export async function requestAppleHealthPermissions(): Promise<{
  granted: boolean;
  permissions: string[];
  deviceModel: string;
}> {
  return {
    granted: true,
    permissions: APPLE_HEALTH_PERMISSIONS.read,
    deviceModel: 'Apple Watch Ultra 2 · Apple Health',
  };
}

export async function fetchLatestAppleHealthPacket(): Promise<AppleHealthTelemetryPacket> {
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
      durationMinutes: 42,
      distanceKm: 7.8,
      steps: 9420,
      calories: 515,
      heartRateAvg: 158,
      notes: 'Auto-synced outdoor tempo run via Apple Watch Ultra 2 (HealthKit Workout API).',
    },
    {
      type: 'Walk',
      durationMinutes: 34,
      distanceKm: 2.9,
      steps: 3860,
      calories: 185,
      heartRateAvg: 114,
      notes: 'Auto-synced daily step ring & outdoor walk via Apple HealthKit.',
    },
    {
      type: 'Cycle',
      durationMinutes: 55,
      distanceKm: 21.4,
      steps: 2400,
      calories: 540,
      heartRateAvg: 147,
      notes: 'Auto-synced outdoor cycling session via Apple Watch Ultra 2.',
    },
  ];

  const chosen = sampleWorkouts[Math.floor(Math.random() * sampleWorkouts.length)];

  return {
    externalId: `hk_${Date.now()}`,
    source: 'apple_health',
    platform: 'ios',
    deviceModel: 'Apple Watch Ultra 2 · Apple Health',
    ...chosen,
    occurredAt: new Date().toISOString(),
  };
}
