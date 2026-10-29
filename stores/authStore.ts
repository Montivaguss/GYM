import { create } from 'zustand';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleAuthProvider } from '../src/lib/firebase.ts';
import { apiFetch } from '../services/supabase.ts';

interface AuthState {
  isAuthenticated: boolean;
  isGoogleAuthenticated: boolean;
  idToken: string | null;
  activeUserId: string;
  authEmail: string | null;
  authError: string | null;
  isLoadingAuth: boolean;
  signInWithGoogle: () => Promise<void>;
  authenticateWithEmail: (payload: {
    email: string;
    password: string;
    fullName?: string;
    mode: 'login' | 'signup';
  }) => Promise<boolean>;
  switchDemoAthlete: (athleteId: string) => void;
  logout: () => Promise<void>;
  initAuthListener: (onAuthChanged?: () => void) => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: true,
  isGoogleAuthenticated: false,
  idToken: null,
  activeUserId: 'athlete_alex',
  authEmail: 'alex.rivera@movewave.app',
  authError: null,
  isLoadingAuth: false,

  signInWithGoogle: async () => {
    set({ isLoadingAuth: true, authError: null });
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      set({
        isAuthenticated: true,
        isGoogleAuthenticated: true,
        idToken: token,
        activeUserId: result.user.uid,
        authEmail: result.user.email,
        isLoadingAuth: false,
      });
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      set({
        authError: error?.message || 'Google Sign-In was cancelled or failed.',
        isLoadingAuth: false,
      });
    }
  },

  authenticateWithEmail: async ({ email, password, fullName, mode }) => {
    set({ isLoadingAuth: true, authError: null });
    try {
      const res = await apiFetch<{
        userId: string;
        email: string;
        mode: 'login' | 'signup';
      }>('/api/auth/email', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName, mode }),
      });

      set({
        isAuthenticated: true,
        isGoogleAuthenticated: false,
        idToken: null,
        activeUserId: res.userId,
        authEmail: res.email,
        authError: null,
        isLoadingAuth: false,
      });
      return mode === 'signup';
    } catch (error: any) {
      set({
        authError: error?.message || 'Unable to authenticate with email and password.',
        isLoadingAuth: false,
      });
      return false;
    }
  },

  switchDemoAthlete: (athleteId: string) => {
    set({
      isAuthenticated: true,
      isGoogleAuthenticated: false,
      idToken: null,
      activeUserId: athleteId,
      authEmail: `${athleteId.replace('athlete_', '')}@movewave.app`,
      authError: null,
    });
  },

  logout: async () => {
    try {
      if (get().isGoogleAuthenticated) {
        await firebaseSignOut(auth);
      }
    } catch (err) {
      console.error('Error signing out:', err);
    }
    set({
      isAuthenticated: false,
      isGoogleAuthenticated: false,
      idToken: null,
      authError: null,
    });
  },

  initAuthListener: (onAuthChanged) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        set({
          isAuthenticated: true,
          isGoogleAuthenticated: true,
          idToken: token,
          activeUserId: user.uid,
          authEmail: user.email,
        });
        if (onAuthChanged) onAuthChanged();
      }
    });
    return unsubscribe;
  },
}));
