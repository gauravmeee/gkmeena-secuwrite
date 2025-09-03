"use client";

import { useState, useEffect, useRef } from "react";
import { FiLock, FiUnlock, FiSettings, FiKey, FiX } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useLock } from "../context/LockContext";
import LockModal from "./LockModal";

export default function LockMenu({ isMobile = false, isCompact = false }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modalMode, setModalMode] = useState("unlock");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const menuRef = useRef(null);

  const { user } = useAuth();
  const {
    hasPassword,
    isUnlocked,
    lockJournal,
    lock,
    updateLockJournal
  } = useLock();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleMenuClick = () => {
    // If locked, directly open unlock modal
    if (hasPassword && !isUnlocked) {
      setModalMode("unlock");
      setIsModalOpen(true);
      return;
    }
    
    // Otherwise, show dropdown menu
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuItemClick = (action) => {
    setIsMenuOpen(false);

    switch (action) {
      case "set":
        setModalMode("set");
        setIsModalOpen(true);
        break;
      case "unlock":
        setModalMode("unlock");
        setIsModalOpen(true);
        break;
      case "change":
        setModalMode("changeSimple");
        setIsModalOpen(true);
        break;
      case "remove":
        setModalMode("remove");
        setIsModalOpen(true);
        break;
      case "lock":
        lock();
        break;
      case "toggleJournal":
        updateLockJournal(!lockJournal);
        break;
      default:
        break;
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Don't show lock menu if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <>
      <div className="relative" ref={menuRef}>

        {/* -- Set Lock - Button in Menu -- */}
        <button
          onClick={handleMenuClick}
          className={`flex items-center justify-center gap-2 w-9 h-9 rounded-md bg-card-bg border border-border transition-all duration-200 hover:bg-border/30 focus:outline-none focus:ring-2 focus:ring-primary/20 ${hasPassword && !isUnlocked ? "text-success hover:text-success-dark" : "text-muted-text hover:text-foreground"}`}

        >
          {hasPassword && !isUnlocked ? (
            <FiLock size={isCompact ? 20 : (isMobile ? 22 : 16)} />
          ) : (
            <FiUnlock size={isCompact ? 20 : (isMobile ? 22 : 16)} />
          )}
          {isMobile && !isCompact && (
            <span className="text-lg">
              {!hasPassword ? "Set Lock" : (hasPassword && !isUnlocked ? "Unlock" : "Lock")}
            </span>
          )}
        </button>

        {isMenuOpen && (
          <div className={`${isMobile && !isCompact ? 'relative mt-2 w-full' : 'absolute right-0 top-full mt-2 w-48'} bg-card-bg border border-border shadow-lg overflow-hidden z-[9999] backdrop-blur-md rounded-lg`}>
            {!hasPassword ? (
              // ---------- Case 1: No password set ----------

              // -- Set Lock - Button in  enu --
              <button
                onClick={() => handleMenuItemClick("set")}
                className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-border/30 transition-colors text-left ${isMobile ? 'text-lg' : ''}`}
              >
                <FiLock size={isMobile ? 22 : 16} />
                <span>Set Lock</span>
              </button>
            ) : (
              // ---------- Case 2: Password set ----------
              <>
                {hasPassword && !isUnlocked ? (
                  // ------ Case 2.1: If Locked ------
                  // No menu items - main button opens unlock modal directly
                  <div className="px-4 py-3 text-sm text-text-secondary">
                    Click the lock button to unlock
                  </div>
                ) : (
                  // ------- Case 2.2: If Unlocked ------
                  <>
                    {/* -- Lock - Button in Menu -- */}
                    <button
                      onClick={() => handleMenuItemClick("lock")}
                      className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-border/30 transition-colors text-left ${isMobile ? 'text-lg' : ''}`}
                    >
                      <FiLock size={isMobile ? 22 : 16} />
                      <span>Lock</span>
                    </button>
                    
                    {/* -- Also Lock Journal - Checkbox in Menu -- */}
                    <div className="px-4 py-3 border-t border-border/30">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lockJournal}
                          onChange={() => handleMenuItemClick("toggleJournal")}
                          className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-primary rounded border-border focus:ring-primary`}
                        />
                        <span className={isMobile ? 'text-base' : 'text-sm'}>Also Lock Journal</span>
                      </label>
                    </div>

                    {/* -- Change Password - Button in Menu -- */}
                    <button
                      onClick={() => handleMenuItemClick("change")}
                      className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-border/30 transition-colors text-left ${isMobile ? 'text-lg' : ''}`}
                    >
                      <FiKey size={isMobile ? 22 : 16} />
                      <span>Change Password</span>
                    </button>
                    
                    {/* -- Remove Lock - Button in Menu -- */}
                    <button
                      onClick={() => handleMenuItemClick("remove")}
                      className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-danger/10 transition-colors text-left text-danger hover:text-danger-dark ${isMobile ? 'text-lg' : ''}`}
                    >
                      <FiX size={isMobile ? 22 : 16} />
                      <span>Remove Lock</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <LockModal
        isOpen={isModalOpen}
        onClose={closeModal}
        mode={modalMode}
      />
    </>
  );
} 