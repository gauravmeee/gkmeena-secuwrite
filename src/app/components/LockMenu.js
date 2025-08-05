"use client";

import { useState, useEffect, useRef } from "react";
import { FiLock, FiUnlock, FiSettings, FiKey, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useLock } from "../../context/LockContext";
import LockModal from "./LockModal";

export default function LockMenu({ isMobile = false }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modalMode, setModalMode] = useState("unlock");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const menuRef = useRef(null);
  
  const { user } = useAuth();
  const { 
    isLocked, 
    hasPassword, 
    isUnlocked, 
    lockJournal,
    removePassword,
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
        setModalMode("change");
        setIsModalOpen(true);
        break;
      case "remove":
        removePassword();
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
        <button
          onClick={handleMenuClick}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
            isMobile 
              ? "w-full justify-start p-4 rounded-lg hover:bg-gray-800/30"
              : "border-2"
          } ${
            isLocked && !isUnlocked
              ? isMobile 
                ? "text-green-500"
                : "border-transparent text-green-500 hover:text-green-400 bg-gray-800/40"
              : isMobile
                ? "text-gray-300"
                : "border-transparent bg-gray-800/40 text-gray-300 hover:text-white hover:bg-gray-700/50"
          }`}
        >
          {isLocked && !isUnlocked ? (
            <FiLock size={isMobile ? 22 : 16} />
          ) : (
            <FiUnlock size={isMobile ? 22 : 16} />
          )}
          {isMobile && (
            <span className="text-lg">
              {!hasPassword ? "Set Lock" : (isLocked && !isUnlocked ? "Unlock" : "Lock")}
            </span>
          )}
        </button>

        {isMenuOpen && (
          <div className={`${isMobile ? 'relative mt-2' : 'absolute right-0 top-full mt-2 w-48'} bg-black/90 backdrop-blur-md rounded-lg shadow-lg overflow-hidden z-50 border border-gray-800/30`}>
            {!hasPassword ? (
              // Case 1: No password set
              <button
                onClick={() => handleMenuItemClick("set")}
                className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700/30 transition-colors text-left ${
                  isMobile ? 'text-lg' : ''
                }`}
              >
                <FiLock size={isMobile ? 22 : 16} />
                <span>Set Lock</span>
              </button>
            ) : (
              // Case 2: Password set
              <>
                {isLocked && !isUnlocked ? (
                  // Case 2.1: If Locked
                  <>
                                         <button
                       onClick={() => handleMenuItemClick("unlock")}
                       className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700/30 transition-colors text-left ${
                         isMobile ? 'text-lg' : ''
                       }`}
                     >
                       <FiUnlock size={isMobile ? 22 : 16} />
                       <span>Unlock</span>
                     </button>
                     
                     <button
                       onClick={() => handleMenuItemClick("change")}
                       className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700/30 transition-colors text-left ${
                         isMobile ? 'text-lg' : ''
                       }`}
                     >
                       <FiKey size={isMobile ? 22 : 16} />
                       <span>Reset Password</span>
                     </button>
                  </>
                                 ) : (
                   // Case 2.2: If Unlocked
                   <>
                     <button
                       onClick={() => handleMenuItemClick("lock")}
                       className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700/30 transition-colors text-left ${
                         isMobile ? 'text-lg' : ''
                       }`}
                     >
                       <FiLock size={isMobile ? 22 : 16} />
                       <span>Lock</span>
                     </button>
                     
                     <div className="px-4 py-3 border-t border-gray-700/30">
                       <label className="flex items-center gap-2 cursor-pointer">
                         <input
                           type="checkbox"
                           checked={lockJournal}
                           onChange={() => handleMenuItemClick("toggleJournal")}
                           className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-primary rounded border-gray-300 focus:ring-primary`}
                         />
                         <span className={isMobile ? 'text-base' : 'text-sm'}>Also Lock Journal</span>
                       </label>
                     </div>
                     
                     <button
                       onClick={() => handleMenuItemClick("change")}
                       className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700/30 transition-colors text-left ${
                         isMobile ? 'text-lg' : ''
                       }`}
                     >
                       <FiKey size={isMobile ? 22 : 16} />
                       <span>Change Password</span>
                     </button>
                     
                     <button
                       onClick={() => handleMenuItemClick("remove")}
                       className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700/30 transition-colors text-left text-red-400 hover:text-red-300 ${
                         isMobile ? 'text-lg' : ''
                       }`}
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