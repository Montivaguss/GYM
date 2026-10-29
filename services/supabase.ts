/**
 * MoveWave Hybrid Data Client (services/supabase.ts)
 *
 * - In React Native / Expo environments configured with EXPO_PUBLIC_SUPABASE_URL
 *   and EXPO_PUBLIC_SUPABASE_ANON_KEY, this module provides the typed client
 *   and real-time channel helpers for Supabase Auth, Postgres, and Realtime.
 * - In the AI Studio full-stack runtime, API calls are routed through the
 *   authenticated `/api/*` Express + Cloud SQL PostgreSQL endpoints.
 */

export interface SupabaseClientConfig {
  url: string;
  anonKey: string;
}

export const supabaseConfig: SupabaseClientConfig = {
  url:
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.EXPO_PUBLIC_SUPABASE_URL) ||
    'https://your-project-ref.supabase.co',
  anonKey:
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
    'public-anon-key',
};

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  idToken?: string | null,
  demoAthleteId: string = 'athlete_alex'
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-athlete-id': demoAthleteId,
    ...((options.headers as Record<string, string>) || {}),
  };

  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}
