"use client";
import Link from "next/link";
import { FiGithub, FiHeart, FiBook, FiLinkedin, FiExternalLink } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();
  
  return (
    <footer className="bg-black/90 backdrop-blur-sm text-gray-400 py-4 mt-6 border-t border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <FiBook className="text-primary" size={16} />
            <span className="text-sm font-semibold text-white">Unseen Stories</span>
            <span className="text-xs mx-2">|</span>
            <div className="flex items-center gap-3">
              <a href="https://github.com/gauravmeee" className="text-gray-500 hover:text-primary transition-colors">
                <FiGithub size={14} />
              </a>
              <a href="https://www.linkedin.com/in/gauravmeee/" className="text-gray-500 hover:text-primary transition-colors">
                <FiLinkedin size={14} />
              </a>
              
            <a 
              href="https://gkmeena.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs hover:text-primary transition-colors flex items-center gap-1"
            >
              <span>Know me</span>
              <FiExternalLink size={10} />
            </a>
            </div>
          </div>
          
          {/* Links - Horizontal */}
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-xs hover:text-primary transition-colors">About</Link>
            <Link href="/privacy" className="text-xs hover:text-primary transition-colors">Privacy</Link>
            <p className="text-xs flex items-center gap-1">
              <span>Made with</span> <FiHeart size={10} className="text-red-500" /> <span>by GKmeena</span>
            </p>
            <p className="text-xs">© {currentYear}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
