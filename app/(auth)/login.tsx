import React, { useState } from 'react';
import { LogIn, Users, Zap, Mail, Lock, User, Watch } from 'lucide-react';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';

interface LoginScreenProps {
  onSignInWithGoogle: () => Promise<void>;
  onAuthenticateWithEmail?: (payload: {
    email: string;
    password: string;
    fullName?: string;
    mode: 'login' | 'signup';
  }) => Promise<boolean>;
  onContinueAsDemo: (athleteId: string) => void;
  authError?: string | null;
  isLoading?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSignInWithGoogle,
  onAuthenticateWithEmail,
  onContinueAsDemo,
  authError,
  isLoading,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('alex.rivera@movewave.app');
  const [password, setPassword] = useState('movewave2026');
  const [fullName, setFullName] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    if (onAuthenticateWithEmail) {
      await onAuthenticateWithEmail({
        email,
        password,
        fullName: mode === 'signup' ? fullName : undefined,
        mode,
      });
    } else {
      onContinueAsDemo('athlete_alex');
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-6 p-6 sm:p-8">
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            {mode === 'login' ? 'Sign In to MoveWave' : 'Create MoveWave Account'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Auto-sync Apple Health & Google Fit, track daily steps, and compete on global weekly leaderboards.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setResetMessage(null);
            }}
            className={`min-h-[38px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setEmail('');
              setPassword('');
              setResetMessage(null);
            }}
            className={`min-h-[38px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Sign Up
          </button>
        </div>

        {authError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
            {authError}
          </div>
        )}

        {resetMessage && (
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-600 dark:text-teal-400">
            {resetMessage}
          </div>
        )}

        <form onSubmit={handleSubmitEmail} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jordan Vance"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@movewave.app"
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Password
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() =>
                    setResetMessage(
                      `Password reset instructions sent to ${email || 'your email'}.`
                    )
                  }
                  className="text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLoading}
          >
            <LogIn className="w-4 h-4" />
            {isLoading
              ? 'Authenticating...'
              : mode === 'login'
              ? 'Sign In with Email'
              : 'Create Account & Set Goals'}
          </Button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="grow border-t border-slate-200 dark:border-slate-800" />
          <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-slate-400">
            or continue with
          </span>
          <div className="grow border-t border-slate-200 dark:border-slate-800" />
        </div>

        <div className="space-y-2.5">
          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={onSignInWithGoogle}
            disabled={isLoading}
          >
            <Watch className="w-4 h-4 text-teal-500" />
            Continue with Google OAuth
          </Button>

          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => onContinueAsDemo('athlete_alex')}
          >
            <Users className="w-4 h-4" />
            Instant Demo: Alex Rivera (Apple Watch Connected)
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LoginScreen;
