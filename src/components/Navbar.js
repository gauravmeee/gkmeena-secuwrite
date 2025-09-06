"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { FiBook, FiEdit, FiHome, FiUser, FiLogOut, FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import LockMenu from "./LockMenu";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut, toggleAuthModal } = useAuth();
  const { isDark, mounted } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Get the initial theme from the DOM to avoid hydration mismatch
  const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  };

  const currentTheme = mounted ? isDark : getInitialTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => {
    return pathname === path
      ? "text-primary font-medium relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full"
      : "text-foreground/70 hover:text-foreground relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:rounded-full hover:after:w-full after:transition-all after:duration-300";
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`nav-writing w-full px-4 py-4 fixed top-0 left-0 z-10 transition-all duration-300 ${scrolled
        ? "shadow-lg"
        : ""
      }`}>
      <div className="max-w-[var(--content-width)] mx-auto flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
        <Image
          src={currentTheme ? "/assets/icons/sw-icon-dark.png" : "/assets/icons/sw-icon-light.png"}
          alt="Secuwrite Logo"
          className="w-12 h-12"
          width={48} // 12 * 4px (Tailwind w-12)
          height={48} // 12 * 4px (Tailwind h-12)
        />
        <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Secuwrite
        </span>
      </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className={`flex items-center gap-1.5 py-2 transition-colors duration-200 ${isActive('/')}`}>
            <FiHome size={18} />
            <span>Home</span>
          </Link>
          <Link href="/diary" className={`flex items-center gap-1.5 py-2 transition-colors duration-200 ${isActive('/diary')}`}>
            <FiEdit size={18} />
            <span>Diary</span>
          </Link>
          <Link href="/journal" className={`flex items-center gap-1.5 py-2 transition-colors duration-200 ${isActive('/journal')}`}>
            <FiBook size={18} />
            <span>Journal</span>
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />

          {user ? (
            <>
              <LockMenu isMobile={false} />
              <div className="relative group z-[9999]">
                <button className="flex items-center gap-2 px-4 py-2 bg-card-bg/40 backdrop-blur-sm rounded-full hover:bg-card-bg/60 transition-all duration-200 ml-2 border border-border/30">
                  <span className="text-sm font-medium truncate max-w-32 text-foreground">
                    {user.email.split('@')[0]}
                  </span>
                  <FiChevronDown size={16} className="text-primary transition-transform duration-200 group-hover:rotate-180" />
                </button>

                <div className="absolute right-0 top-full mt-2 w-48 bg-card-bg/95 backdrop-blur-md rounded-lg shadow-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-[9999] border border-border/30">
                  <div className="p-3 border-b border-border/30">
                    <p className="text-sm text-muted-text truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-border/30 transition-colors text-left text-foreground"
                  >
                    <FiLogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={toggleAuthModal}
              className="login-button"
            >
              <FiUser size={16} />
              <span>Login</span>
            </button>
          )}
        </div>

        {/* Mobile Menu Button and Lock Button */}
        <div className="md:hidden flex items-center gap-3">
          <ThemeToggle />
          {user && <LockMenu isMobile={true} isCompact={true} />}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-card-bg/40 backdrop-blur-sm border border-border/30 hover:bg-card-bg/60 transition-colors"
          >
            {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-card-bg/95 backdrop-blur-md border-b border-border/30 shadow-lg">
          <div className="px-4 py-6 space-y-4">
            <Link
              href="/"
              className={`flex items-center gap-3 py-3 transition-colors ${isActive('/')}`}
              onClick={closeMobileMenu}
            >
              <FiHome size={20} />
              <span>Home</span>
            </Link>
            <Link
              href="/diary"
              className={`flex items-center gap-3 py-3 transition-colors ${isActive('/diary')}`}
              onClick={closeMobileMenu}
            >
              <FiEdit size={20} />
              <span>Diary</span>
            </Link>
            <Link
              href="/journal"
              className={`flex items-center gap-3 py-3 transition-colors ${isActive('/journal')}`}
              onClick={closeMobileMenu}
            >
              <FiBook size={20} />
              <span>Journal</span>
            </Link>

            {user ? (
              <div className="pt-4 border-t border-border/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.email.split('@')[0]}</p>
                    <p className="text-xs text-muted-text">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    closeMobileMenu();
                  }}
                  className="w-full flex items-center gap-3 py-3 text-foreground hover:text-primary transition-colors"
                >
                  <FiLogOut size={20} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  toggleAuthModal();
                  closeMobileMenu();
                }}
                className="w-full btn-writing"
              >
                <FiUser size={20} />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 