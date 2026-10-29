import React from 'react';

/**
 * Root Layout (`app/_layout.tsx`)
 * Configures global providers, theme synchronization, and navigation shell
 * for MoveWave across mobile and web viewports.
 */
export const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {children}
    </div>
  );
};

export default RootLayout;
