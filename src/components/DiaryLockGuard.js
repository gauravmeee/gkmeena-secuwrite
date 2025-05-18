"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDiaryLock } from '../context/DiaryLockContext';
import DiaryLock from '../app/components/DiaryLock';

export default function DiaryLockGuard({ children }) {
  const { isLocked, setIsLocked, isLoading } = useDiaryLock();
  const pathname = usePathname();
  const router = useRouter();

  // List of paths that should be protected
  const protectedPaths = [
    '/diary',
    '/diary/edit',
  ];

  // Check if the current path should be protected
  const shouldProtect = () => {
    // Allow /diary/new without lock
    if (pathname === '/diary/new') return false;
    
    // Check if it's a diary entry view page (/diary/[id])
    if (pathname.match(/^\/diary\/[^/]+$/)) return true;
    
    // Check if it's a diary entry edit page (/diary/edit/[id])
    if (pathname.match(/^\/diary\/edit\/[^/]+$/)) return true;
    
    // Check other protected paths
    return protectedPaths.some(path => pathname.startsWith(path));
  };

  // If we're loading and this is a protected path, show minimal loading state
  if (isLoading && shouldProtect()) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        {/* Render a blurred version of the content in the background */}
        <div className="opacity-50 pointer-events-none filter blur-sm">
          {children}
        </div>
      </div>
    );
  }

  // If we're on a protected path and it's locked, show the lock screen
  if (shouldProtect() && isLocked) {
    return <DiaryLock onUnlock={() => setIsLocked(false)} />;
  }

  // Otherwise, show the children
  return children;
} 