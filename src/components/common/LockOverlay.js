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
          className="rounded-xl absolute inset-0 transition-all duration-100 group-hover:translate-y-[-1px] bg-bg-overlay backdrop-blur-[10px]  flex items-center justify-center z-[5] cursor-pointer shadow-sm border border-border-primary hover:border-primary/30 hover:shadow-md"
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
          onClick={handleOverlayClick}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="text-center p-4 select-none">
           
            <div className="flex justify-center mb-3">
              {/* -- Lock Icon -- */}
              <div className="w-16 h-16 bg-gradient-to-r from-primary/60 to-secondary/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                  
                  <FiLock size={28} className="text-tertiary" />

              </div>
            </div>
            
            <p className="text-sm text-text-secondary">
              {!hasPassword 
                ? "Set a password to protect your content"
                : "This content is protected. Unlock to view."
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