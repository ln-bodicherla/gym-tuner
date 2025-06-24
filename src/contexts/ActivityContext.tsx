
import React, { createContext, useContext, ReactNode } from 'react';
import { useActivityLogger, ActivityLog } from '@/hooks/useActivityLogger';

interface ActivityContextType {
  activities: ActivityLog[];
  loading: boolean;
  logActivity: (
    type: ActivityLog['activity_type'],
    description: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
  refreshActivities: () => Promise<void>;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

interface ActivityProviderProps {
  children: ReactNode;
}

export const ActivityProvider = ({ children }: ActivityProviderProps) => {
  const activityLogger = useActivityLogger();

  return (
    <ActivityContext.Provider value={activityLogger}>
      {children}
    </ActivityContext.Provider>
  );
};
