"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { FiBook, FiEdit, FiHome, FiUser, FiLogOut, FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import LockMenu from "./LockMenu";

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut, toggleAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
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
      : "text-foreground/70 hover:text-white relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:rounded-full hover:after:w-full after:transition-all after:duration-300";
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  return (
    <nav className={`w-full px-4 py-4 fixed top-0 left-0 z-10 transition-all duration-300 ${
      scrolled 
        ? "bg-black/80 backdrop-blur-md border-b border-gray-800/50" 
        : "md:bg-transparent md:border-b md:border-transparent bg-black/80 backdrop-blur-md border-b border-gray-800/50"
    }`}>
      <div className="max-w-[var(--content-width)] mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
          <img src="/favicon.png" alt="Unseen Stories Logo" className="w-12 h-12" />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Unseen Stories</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
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


          
          {user ? (
            <>
              <LockMenu />
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-800/40 backdrop-blur-sm rounded-full hover:bg-gray-700/50 transition-all duration-200 ml-2">
                  <span className="text-sm font-medium truncate max-w-32">
                    {user.email.split('@')[0]}
                  </span>
                  <FiChevronDown size={16} className="text-primary transition-transform duration-200 group-hover:rotate-180" />
                </button>
                
                <div className="absolute right-0 top-full mt-2 w-48 bg-black/90 backdrop-blur-md rounded-lg shadow-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 border border-gray-800/30">
                  <div className="p-3 border-b border-gray-700/30">
                    <p className="text-sm text-gray-300 truncate">{user.email}</p>
                  </div>
                  <button 
                    onClick={signOut}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700/30 transition-colors text-left"
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
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-primary to-secondary hover:shadow-md hover:shadow-primary/20 transition-all duration-300 transform hover:translate-y-[-2px]"
            >
              <FiUser size={16} />
              <span>Login</span>
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden flex items-center justify-center p-2 rounded-full text-gray-300 hover:text-white bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-lg p-4 animate-fadeIn z-40">
          <div className="flex flex-col gap-4 mt-8">
            <Link href="/" 
              className={`flex items-center gap-3 p-4 rounded-lg ${pathname === '/' ? 'bg-gray-800/50 border border-primary/30' : 'hover:bg-gray-800/30'}`}
              onClick={closeMobileMenu}
            >
              <FiHome size={22} className={pathname === '/' ? 'text-primary' : ''} />
              <span className="text-lg">{pathname === '/' ? <span className="gradient-text font-medium">Home</span> : 'Home'}</span>
            </Link>
            <Link href="/diary" 
              className={`flex items-center gap-3 p-4 rounded-lg ${pathname === '/diary' ? 'bg-gray-800/50 border border-primary/30' : 'hover:bg-gray-800/30'}`}
              onClick={closeMobileMenu}
            >
              <FiEdit size={22} className={pathname === '/diary' ? 'text-primary' : ''} />
              <span className="text-lg">{pathname === '/diary' ? <span className="gradient-text font-medium">Diary</span> : 'Diary'}</span>
            </Link>
            <Link href="/journal" 
              className={`flex items-center gap-3 p-4 rounded-lg ${pathname === '/journal' ? 'bg-gray-800/50 border border-primary/30' : 'hover:bg-gray-800/30'}`}
              onClick={closeMobileMenu}
            >
              <FiBook size={22} className={pathname === '/journal' ? 'text-primary' : ''} />
              <span className="text-lg">{pathname === '/journal' ? <span className="gradient-text font-medium">Journal</span> : 'Journal'}</span>
            </Link>


            
            {user ? (
              <div className="mt-4 border-t border-gray-800/30 pt-4">
                <div className="px-4 py-3 text-sm text-gray-400 bg-gray-800/50 rounded-lg">
                  {user.email}
                </div>
                <button 
                  onClick={() => {
                    signOut();
                    closeMobileMenu();
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-lg mt-3 hover:bg-gray-800/30"
                >
                  <FiLogOut size={22} />
                  <span className="text-lg">Sign Out</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  toggleAuthModal();
                  closeMobileMenu();
                }}
                className="flex items-center justify-center gap-3 p-4 mt-4 rounded-lg bg-gradient-to-r from-primary to-secondary text-white w-full"
              >
                <FiUser size={22} />
                <span className="text-lg font-medium">Login</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 