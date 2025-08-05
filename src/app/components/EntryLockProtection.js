"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLock } from "../../context/LockContext";
import LockModal from "./LockModal";

export default function EntryLockProtection({ children, entryType }) {
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const router = useRouter();
  
  const { isLocked, isUnlocked, shouldBlur, isLoading } = useLock();

  useEffect(() => {
    // Only check lock state after loading is complete
    if (!isLoading) {
      // Check if this entry type should be protected and user is not unlocked
      if (isLocked && !isUnlocked && shouldBlur(entryType)) {
        setShowUnlockPrompt(true);
      } else {
        setShowUnlockPrompt(false);
      }
    }
  }, [isLocked, isUnlocked, shouldBlur, entryType, isLoading]);

  const handleClose = () => {
    setShowUnlockPrompt(false);
  };

  // Show loading state while lock context is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="flex justify-center items-center h-screen">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse"></div>
            <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-150"></div>
            <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-300"></div>
          </div>
        </div>
      </div>
    );
  }

  if (showUnlockPrompt) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <LockModal
          isOpen={true}
          onClose={handleClose}
          mode="unlock"
        />
      </div>
    );
  }

  return children;
} 