"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const DiaryLockContext = createContext({
  isLocked: true,
  setIsLocked: () => {},
  checkLockStatus: async () => {},
  isLoading: true,
});

// Cache the lock status
let lockStatusCache = {
  userId: null,
  isLocked: true,
  timestamp: null,
};

// Cache duration - 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export function DiaryLockProvider({ children }) {
  const [isLocked, setIsLocked] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const checkLockStatus = async (skipCache = false) => {
    if (!user) {
      setIsLocked(true);
      setIsLoading(false);
      return true;
    }

    // Check cache first
    if (!skipCache && 
        lockStatusCache.userId === user.id && 
        lockStatusCache.timestamp && 
        Date.now() - lockStatusCache.timestamp < CACHE_DURATION) {
      setIsLocked(lockStatusCache.isLocked);
      setIsLoading(false);
      return lockStatusCache.isLocked;
    }

    try {
      const { data } = await supabase
        .from('diary_lock_passwords')
        .select('password_hash')
        .eq('user_id', user.id)
        .single();

      const newLockStatus = !data ? false : true;
      
      // Update cache
      lockStatusCache = {
        userId: user.id,
        isLocked: newLockStatus,
        timestamp: Date.now(),
      };

      setIsLocked(newLockStatus);
      return newLockStatus;
    } catch (error) {
      console.error('Error checking lock status:', error);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  // Check lock status when user changes
  useEffect(() => {
    checkLockStatus();
  }, [user]);

  const contextValue = {
    isLocked,
    setIsLocked: (newValue) => {
      setIsLocked(newValue);
      // Update cache when lock status changes
      if (user) {
        lockStatusCache = {
          userId: user.id,
          isLocked: newValue,
          timestamp: Date.now(),
        };
      }
    },
    checkLockStatus,
    isLoading,
  };

  return (
    <DiaryLockContext.Provider value={contextValue}>
      {children}
    </DiaryLockContext.Provider>
  );
}

export function useDiaryLock() {
  const context = useContext(DiaryLockContext);
  if (!context) {
    throw new Error('useDiaryLock must be used within a DiaryLockProvider');
  }
  return context;
} 