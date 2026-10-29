import React from 'react';

/**
 * Tabs Layout (`app/(tabs)/_layout.tsx`)
 * Defines the primary bottom tab destinations for MoveWave across iOS, Android, and Web.
 */
export const TabsLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="w-full">{children}</div>;
};

export default TabsLayout;
