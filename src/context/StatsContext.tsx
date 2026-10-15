'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DashboardStats } from '@/lib/types';

interface StatsContextType {
  stats: DashboardStats | null;
  refreshStats: () => Promise<void>;
}

const StatsContext = createContext<StatsContextType>({
  stats: null,
  refreshStats: async () => {},
});

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return (
    <StatsContext.Provider value={{ stats, refreshStats }}>
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => useContext(StatsContext);
