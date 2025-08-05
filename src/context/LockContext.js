"use client";

import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import lockService from '../lib/lockService';

// Create lock context
const LockContext = createContext();

// Lock provider component
export function LockProvider({ children }) {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [lockJournal, setLockJournal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load lock settings from database on mount
  useEffect(() => {
    async function loadLockSettings() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const settings = await lockService.getLockSettings(user.id);
        setHasPassword(settings.has_password || false);
        setLockJournal(settings.lock_journal || false);
        
        // Always start locked if user has a password set
        if (settings.has_password) {
          setIsLocked(true);
          setIsUnlocked(false);
        } else {
          setIsLocked(false);
          setIsUnlocked(false);
        }
      } catch (error) {
        console.error('Error loading lock settings:', error);
        // Default to unlocked if there's an error
        setIsLocked(false);
        setIsUnlocked(false);
        setHasPassword(false);
        setLockJournal(false);
      } finally {
        setIsLoading(false);
      }
    }

    loadLockSettings();
  }, [user]);

  // Auto-lock when user changes or on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasPassword && isUnlocked) {
        // Lock when page becomes hidden (user switches tabs or minimizes)
        setIsUnlocked(false);
      }
    };

    const handleBeforeUnload = () => {
      if (hasPassword && isUnlocked) {
        // Lock when user leaves the page
        setIsUnlocked(false);
      }
    };

    const handleFocus = () => {
      if (hasPassword && isUnlocked) {
        // Lock when page regains focus (user returns from another tab)
        setIsUnlocked(false);
      }
    };

    if (hasPassword) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', handleFocus);
    };
  }, [hasPassword, isUnlocked]);

  // Set password and enable lock
  const setPassword = async (password, lockJournalSetting = false) => {
    if (!user || !password) {
      return { success: false, error: 'User not found or password is required' };
    }

    try {
      const result = await lockService.setPassword(user.id, password, lockJournalSetting);
      
      if (result.success) {
        setHasPassword(true);
        setIsLocked(true);
        setIsUnlocked(false);
        setLockJournal(lockJournalSetting);
      }
      
      return result;
    } catch (error) {
      console.error('Error setting password:', error);
      return { success: false, error: error.message };
    }
  };

  // Remove password and disable lock
  const removePassword = async () => {
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    try {
      const result = await lockService.removePassword(user.id);
      
      if (result.success) {
        setHasPassword(false);
        setIsLocked(false);
        setIsUnlocked(false);
        setLockJournal(false);
      }
      
      return result;
    } catch (error) {
      console.error('Error removing password:', error);
      return { success: false, error: error.message };
    }
  };

  // Change password
  const changePassword = async (newPassword) => {
    if (!user || !newPassword) {
      return { success: false, error: 'User not found or new password is required' };
    }

    try {
      const result = await lockService.changePassword(user.id, newPassword);
      return result;
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, error: error.message };
    }
  };

  // Unlock with password
  const unlock = async (password) => {
    if (!user || !password) {
      return { success: false, error: 'User not found or password is required' };
    }

    try {
      const result = await lockService.verifyPassword(user.id, password);
      
      if (result.success) {
        setIsUnlocked(true);
      }
      
      return result;
    } catch (error) {
      console.error('Error unlocking:', error);
      return { success: false, error: error.message };
    }
  };

  // Lock the application
  const lock = () => {
    if (hasPassword) {
      setIsUnlocked(false);
      return { success: true };
    }
    return { success: false, error: 'No password set' };
  };

  // Update lock journal setting
  const updateLockJournal = async (lockJournalSetting) => {
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    try {
      const result = await lockService.updateLockJournal(user.id, lockJournalSetting);
      
      if (result.success) {
        setLockJournal(lockJournalSetting);
      }
      
      return result;
    } catch (error) {
      console.error('Error updating lock journal setting:', error);
      return { success: false, error: error.message };
    }
  };

  // Check if content should be blurred
  const shouldBlur = (entryType = null) => {
    if (!isLocked || isUnlocked) return false;
    
    // If lockJournal is true, blur both diary and journal entries
    if (lockJournal) {
      return entryType === 'diary' || entryType === 'journal';
    }
    
    // If lockJournal is false, blur only diary entries
    return entryType === 'diary';
  };

  // Check if route should be protected
  const isRouteProtected = (pathname) => {
    if (!isLocked || isUnlocked) return false;
    
    const protectedRoutes = [
      '/diary',
      '/journal',
      '/diary/draft',
      '/journal/draft'
    ];
    
    // Check if current path matches any protected route
    const isProtected = protectedRoutes.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    );
    
    if (!isProtected) return false;
    
    // If lockJournal is true, protect both diary and journal routes
    if (lockJournal) {
      return pathname.startsWith('/diary') || pathname.startsWith('/journal');
    }
    
    // If lockJournal is false, protect only diary routes
    return pathname.startsWith('/diary');
  };

  // Context values to expose
  const value = {
    isLocked,
    hasPassword,
    isUnlocked,
    lockJournal,
    isLoading,
    setPassword,
    removePassword,
    changePassword,
    unlock,
    lock,
    updateLockJournal,
    setLockJournal,
    shouldBlur,
    isRouteProtected
  };

  return (
    <LockContext.Provider value={value}>
      {children}
    </LockContext.Provider>
  );
}

// Custom hook to use lock context
export const useLock = () => {
  const context = useContext(LockContext);
  if (!context) {
    throw new Error('useLock must be used within a LockProvider');
  }
  return context;
}; 