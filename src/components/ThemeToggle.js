"use client";

import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

export default function ThemeToggle() {
  const { toggleTheme, isDark, mounted } = useTheme();

  // Get the initial theme from the DOM to avoid hydration mismatch
  const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  };

  const currentTheme = mounted ? isDark : getInitialTheme();

  return (
    <button
      onClick={mounted ? toggleTheme : undefined}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-card-bg border border-border hover:bg-border/30 text-muted-text hover:text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
      aria-label={`Switch to ${currentTheme ? 'light' : 'dark'} mode`}
      disabled={!mounted}
    >
      <div className="relative w-4 h-4">
        {/* Sun Icon */}
        <FiSun 
          className={`absolute inset-0 w-4 h-4 transition-all duration-200 ${
            currentTheme ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
          }`}
        />
        {/* Moon Icon */}
        <FiMoon 
          className={`absolute inset-0 w-4 h-4 transition-all duration-200 ${
            currentTheme ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
          }`}
        />
      </div>
    </button>
  );
}
