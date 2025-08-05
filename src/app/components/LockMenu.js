"use client";

import { useState } from "react";
import { FiLock, FiUnlock, FiSettings, FiKey, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useLock } from "../../context/LockContext";
import LockModal from "./LockModal";

export default function LockMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modalMode, setModalMode] = useState("unlock");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { user } = useAuth();
  const { 
    isLocked, 
    hasPassword, 
    isUnlocked, 
    lockJournal,
    removePassword,
    lock,
    setLockJournal
  } = useLock();

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
      <div className="relative">
        <button
          onClick={handleMenuClick}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors border-2 ${
            isLocked && !isUnlocked
              ? "border-green-500 text-green-500 hover:border-green-400 hover:text-green-400 bg-gray-800/40"
              : "border-transparent bg-gray-800/40 text-gray-300 hover:text-white hover:bg-gray-700/50"
          }`}
        >
          {isLocked && !isUnlocked ? (
            <FiLock size={16} />
          ) : (
            <FiUnlock size={16} />
          )}
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-black/90 backdrop-blur-md rounded-lg shadow-lg overflow-hidden z-50 border border-gray-800/30">
            {!hasPassword ? (
              // Case 1: No password set
              <button
                onClick={() => handleMenuItemClick("set")}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700/30 transition-colors text-left"
              >
                <FiLock size={16} />
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
                       className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700/30 transition-colors text-left"
                     >
                       <FiUnlock size={16} />
                       <span>Unlock</span>
                     </button>
                     
                     <button
                       onClick={() => handleMenuItemClick("change")}
                       className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700/30 transition-colors text-left"
                     >
                       <FiKey size={16} />
                       <span>Reset Password</span>
                     </button>
                  </>
                                 ) : (
                   // Case 2.2: If Unlocked
                   <>
                     <button
                       onClick={() => handleMenuItemClick("lock")}
                       className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700/30 transition-colors text-left"
                     >
                       <FiLock size={16} />
                       <span>Lock</span>
                     </button>
                     
                     <div className="px-4 py-3 border-t border-gray-700/30">
                       <label className="flex items-center gap-2 cursor-pointer">
                         <input
                           type="checkbox"
                           checked={lockJournal}
                           onChange={() => handleMenuItemClick("toggleJournal")}
                           className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                         />
                         <span className="text-sm">Also Lock Journal</span>
                       </label>
                     </div>
                     
                     <button
                       onClick={() => handleMenuItemClick("change")}
                       className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700/30 transition-colors text-left"
                     >
                       <FiKey size={16} />
                       <span>Change Password</span>
                     </button>
                     
                     <button
                       onClick={() => handleMenuItemClick("remove")}
                       className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700/30 transition-colors text-left text-red-400 hover:text-red-300"
                     >
                       <FiX size={16} />
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