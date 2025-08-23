import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiX, FiChevronRight, FiLogIn } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function CreateFirstEntryDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, toggleAuthModal } = useAuth();
  
  // Handle escape key press to close dialog
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);
  
  // Stop scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  const entryOptions = [
    {
      title: "Diary Entry",
      description: "Record your daily thoughts and experiences",
      path: "/diary/new",
      icon: "📓",
      bgColor: "bg-secondary/10",
      borderColor: "border-secondary/30",
      hoverBg: "group-hover:bg-secondary/20"
    },
    {
      title: "Journal Entry",
      description: "Write a detailed journal entry with rich formatting",
      path: "/journal/new",
      icon: "📒",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
      hoverBg: "group-hover:bg-primary/20"
    },
  ];
  
  if (!user) {
    return (
      <div className="text-center">
        <button
          onClick={toggleAuthModal}
          className="text-primary hover:text-primary/90 text-lg font-medium transition-colors"
          aria-label="Sign in to create entries"
        >
          Sign in to create entries
        </button>
      </div>
    );
  }
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-primary hover:bg-primary/90 text-white p-4 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
        aria-label="Create new entry"
      >
        <FiPlus size={24} />
      </button>
      
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-bg-primary rounded-xl border border-border-primary p-6 max-w-md w-full shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-text-primary">What would you like to create?</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-full hover:bg-bg-secondary transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              {entryOptions.map(option => (
                <Link 
                  key={option.title}
                  href={option.path}
                  className={`flex items-center gap-4 p-4 ${option.bgColor} border ${option.borderColor} hover:border-primary/30 rounded-lg transition-all group relative overflow-hidden`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className={`absolute inset-0 opacity-0 ${option.hoverBg} transition-opacity`}></div>
                  <div className="text-2xl relative z-10 transform transition-transform group-hover:scale-110">{option.icon}</div>
                  <div className="flex-1 relative z-10">
                    <h4 className="font-medium text-text-primary">{option.title}</h4>
                    <p className="text-sm text-text-secondary">{option.description}</p>
                  </div>
                  <FiChevronRight className="text-text-muted group-hover:text-text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
