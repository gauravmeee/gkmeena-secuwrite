"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLock } from "../context/LockContext";
import LockModal from "./LockModal";
import Loading from "./common/Loading";

export default function EntryLockProtection({ children, entryType }) {
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const [lockCheckComplete, setLockCheckComplete] = useState(false);
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
      setLockCheckComplete(true);
    }
  }, [isLocked, isUnlocked, shouldBlur, entryType, isLoading]);

  const handleClose = (wasSuccessful = false) => {
    // Only redirect back if the user closed/cancelled the modal
    // If unlock was successful, stay on the current page
    if (!wasSuccessful) {
      router.back();
    }
  };

  // Show loading state while lock context is initializing or lock check is not complete
  if (isLoading || !lockCheckComplete) {
    return (
      <Loading/>
    );
  }

  if (showUnlockPrompt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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