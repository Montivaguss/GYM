import React, { useState } from 'react';
import {
  Watch,
  RefreshCw,
  CheckCircle2,
  Moon,
  Sun,
  Bell,
  Shield,
  Smartphone,
} from 'lucide-react';
import {
  Profile,
  HealthConnection,
  HealthSource,
  DistanceUnit,
  ThemeMode,
} from '../../types/index.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { formatRelativeTime } from '../../lib/utils.ts';

interface SettingsTabProps {
  currentUser: Profile;
  healthConnections: HealthConnection[];
  isSyncingWearable: boolean;
  onToggleHealthSource: (
    source: HealthSource,
    action: 'connect' | 'disconnect'
  ) => Promise<void>;
  onSyncWearableNow: (source: HealthSource) => Promise<void>;
  onUpdateProfile: (updates: Partial<Profile>) => Promise<void>;
  onTriggerNotification: (payload: {
    title: string;
    body: string;
    type: string;
  }) => Promise<void>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  currentUser,
  healthConnections,
  isSyncingWearable,
  onToggleHealthSource,
  onSyncWearableNow,
  onUpdateProfile,
  onTriggerNotification,
}) => {
  const [dailyReminder, setDailyReminder] = useState(true);
  const [streakAlert, setStreakAlert] = useState(true);
  const [publicLeaderboard, setPublicLeaderboard] = useState(true);
  const [shareHeartRate, setShareHeartRate] = useState(true);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const appleConn = healthConnections.find((c) => c.source === 'apple_health');
  const googleConn = healthConnections.find((c) => c.source === 'google_fit');

  const isAppleConnected = appleConn?.status === 'connected';
  const isGoogleConnected = googleConn?.status === 'connected';

  const handleSyncClick = async (source: HealthSource) => {
    await onSyncWearableNow(source);
    const label =
      source === 'apple_health'
        ? 'Apple HealthKit (Apple Watch)'
        : 'Google Fit / Health Connect';
    setSyncNotice(
      `Synced latest steps, workout, active calories, and heart rate from ${label}.`
    );
    setTimeout(() => setSyncNotice(null), 4000);
  };

  const handleThemeChange = async (theme: ThemeMode) => {
    await onUpdateProfile({ theme });
  };

  const handleUnitChange = async (distanceUnit: DistanceUnit) => {
    await onUpdateProfile({ distanceUnit });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
          Wearable Sync & App Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage Apple Health (iOS), Google Fit / Health Connect (Android), units, theme, and privacy
        </p>
      </div>

      {syncNotice && (
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-sm text-teal-700 dark:text-teal-300 font-medium flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
            {syncNotice}
          </span>
          <button
            type="button"
            onClick={() => setSyncNotice(null)}
            className="text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Wearable & Health Data Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Apple Health / HealthKit Card */}
        <Card className="flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                  <Watch className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Apple Health · HealthKit (iOS)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Apple Watch Series / Ultra automatic background sync
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-mono-tabular font-semibold ${
                  isAppleConnected
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-slate-400'
                }`}
              >
                {isAppleConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
              Syncs <span className="font-semibold">StepCount</span>,{' '}
              <span className="font-semibold">Workout Sessions</span>,{' '}
              <span className="font-semibold">Walking/Running Distance</span>,{' '}
              <span className="font-semibold">Active Energy (kcal)</span>, and{' '}
              <span className="font-semibold">Heart Rate (bpm)</span>.
            </p>

            {appleConn?.lastSyncAt && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                Last synced · {formatRelativeTime(appleConn.lastSyncAt)} ·{' '}
                {appleConn.metadata?.device || 'Apple Watch Ultra 2'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant={isAppleConnected ? 'secondary' : 'primary'}
              size="sm"
              onClick={() =>
                onToggleHealthSource(
                  'apple_health',
                  isAppleConnected ? 'disconnect' : 'connect'
                )
              }
            >
              {isAppleConnected ? 'Disconnect Apple Health' : 'Connect Apple Health'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={isSyncingWearable}
              onClick={() => handleSyncClick('apple_health')}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncingWearable ? 'animate-spin' : ''}`}
              />
              Sync Watch Now
            </Button>
          </div>
        </Card>

        {/* Google Fit / Android Health Connect Card */}
        <Card className="flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Google Fit · Health Connect (Android)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pixel Watch, Galaxy Watch & Wear OS telemetry sync
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-mono-tabular font-semibold ${
                  isGoogleConnected
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-slate-400'
                }`}
              >
                {isGoogleConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
              Syncs <span className="font-semibold">READ_STEPS</span>,{' '}
              <span className="font-semibold">READ_EXERCISE</span>,{' '}
              <span className="font-semibold">READ_DISTANCE</span>,{' '}
              <span className="font-semibold">READ_ACTIVE_CALORIES_BURNED</span>, and{' '}
              <span className="font-semibold">READ_HEART_RATE</span>.
            </p>

            {googleConn?.lastSyncAt && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                Last synced · {formatRelativeTime(googleConn.lastSyncAt)} ·{' '}
                {googleConn.metadata?.device || 'Pixel Watch 3 · Health Connect'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant={isGoogleConnected ? 'secondary' : 'primary'}
              size="sm"
              onClick={() =>
                onToggleHealthSource(
                  'google_fit',
                  isGoogleConnected ? 'disconnect' : 'connect'
                )
              }
            >
              {isGoogleConnected ? 'Disconnect Health Connect' : 'Connect Health Connect'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={isSyncingWearable}
              onClick={() => handleSyncClick('google_fit')}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncingWearable ? 'animate-spin' : ''}`}
              />
              Sync Watch Now
            </Button>
          </div>
        </Card>
      </div>

      {/* Display, Units, Privacy & Notifications Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Display & Measurement Units
          </h2>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Theme Mode
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                High-contrast dark mode or outdoor daylight mode
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                  currentUser.theme === 'dark'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                Dark
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                  currentUser.theme === 'light'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Light
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Distance Unit
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Metric (km) or Imperial (mi)
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => handleUnitChange('km')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-mono-tabular font-semibold cursor-pointer ${
                  currentUser.distanceUnit === 'km'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                km
              </button>
              <button
                type="button"
                onClick={() => handleUnitChange('mi')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-mono-tabular font-semibold cursor-pointer ${
                  currentUser.distanceUnit === 'mi'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                mi
              </button>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Privacy & Smart Notifications
            </h2>
            <Shield className="w-4 h-4 text-teal-500" />
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">
                Daily Movement Reminder
              </span>
              <input
                type="checkbox"
                checked={dailyReminder}
                onChange={(e) => setDailyReminder(e.target.checked)}
                className="w-4 h-4 accent-teal-600 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">
                Evening Streak Warning Alert
              </span>
              <input
                type="checkbox"
                checked={streakAlert}
                onChange={(e) => setStreakAlert(e.target.checked)}
                className="w-4 h-4 accent-teal-600 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">
                Show Profile on Global Leaderboards
              </span>
              <input
                type="checkbox"
                checked={publicLeaderboard}
                onChange={(e) => setPublicLeaderboard(e.target.checked)}
                className="w-4 h-4 accent-teal-600 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">
                Include Heart Rate Telemetry on Feed Posts
              </span>
              <input
                type="checkbox"
                checked={shareHeartRate}
                onChange={(e) => setShareHeartRate(e.target.checked)}
                className="w-4 h-4 accent-teal-600 cursor-pointer"
              />
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() =>
              onTriggerNotification({
                title: 'Wearable Sync & Goal Update',
                body: 'Your Apple Watch synced +3,860 steps. You are on pace to beat your weekly average!',
                type: 'goal_progress',
              })
            }
          >
            <Bell className="w-4 h-4 text-amber-500" />
            Trigger Test Notification
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default SettingsTab;
