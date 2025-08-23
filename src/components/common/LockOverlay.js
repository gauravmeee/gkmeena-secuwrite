"use client";

import { FiLock, FiUnlock } from "react-icons/fi";
import { useLock } from "@/context/LockContext";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";
import LockModal from "../LockModal";

export default function LockOverlay({ entryType, className = "", children }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { shouldBlur, isLocked, isUnlocked, hasPassword } = useLock();
  const { theme, mounted } = useTheme();
  
  const shouldShowOverlay = shouldBlur(entryType);
  
  const handleOverlayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasPassword && isLocked && !isUnlocked) {
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // If content should be protected, render secured content with placeholder data
  if (shouldShowOverlay) {
    return (
      <div className={`relative ${className}`}>
        {/* Secured Content Container with heavily blurred placeholder */}
        <div 
          className="select-none pointer-events-none"
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'transparent',
            filter: 'blur(12px) grayscale(80%)',
            opacity: '0.2'
          }}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onPaste={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            // Prevent all keyboard shortcuts
            e.preventDefault();
          }}
        >
          {children}
        </div>
        
        {/* Lock Overlay */}
        <div 
          className="absolute inset-0 backdrop-blur-[4px] rounded-lg flex items-center justify-center z-[5] cursor-pointer"
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            backgroundColor: 'var(--bg-overlay)'
          }}
          onClick={handleOverlayClick}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="text-center p-4 select-none text-text-primary">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                {isLocked && !isUnlocked ? (
                  <FiLock size={28} className="text-tertiary" />
                ) : (
                  <FiUnlock size={28} className="text-text-muted" />
                )}
              </div>
            </div>
            
            <p className="text-sm text-text-secondary">
              {!hasPassword 
                ? "Set a password to protect your content"
                : isLocked && !isUnlocked 
                  ? "This content is protected. Unlock to view."
                  : "This content is protected but currently unlocked."
              }
            </p>
          </div>
        </div>

        {/* Lock Modal */}
        <LockModal
          isOpen={isModalOpen}
          onClose={closeModal}
          mode="unlock"
        />
      </div>
    );
  }

  // If not protected, return children normally
  return children;
}