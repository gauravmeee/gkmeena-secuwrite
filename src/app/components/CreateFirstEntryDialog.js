import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiX, FiChevronRight } from 'react-icons/fi';

export default function CreateFirstEntryDialog() {
  const [isOpen, setIsOpen] = useState(false);
  
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
      title: "Journal Entry",
      description: "Write a detailed journal entry with rich formatting",
      path: "/journal/new",
      icon: "📒",
      bgColor: "bg-green-400/10",
      borderColor: "border-green-400/30",
      hoverBg: "group-hover:bg-green-400/20"
    },
    {
      title: "Diary Entry",
      description: "Record your daily thoughts and experiences",
      path: "/diary/new",
      icon: "📓",
      bgColor: "bg-blue-400/10",
      borderColor: "border-blue-400/30",
      hoverBg: "group-hover:bg-blue-400/20"
    },
    {
      title: "Story",
      description: "Create an original story",
      path: "/stories/new",
      icon: "✍️",
      bgColor: "bg-yellow-400/10",
      borderColor: "border-yellow-400/30",
      hoverBg: "group-hover:bg-yellow-400/20"
    },
    {
      title: "Song/Poem",
      description: "Express yourself through songs and poetry",
      path: "/songs/new",
      icon: "🎵",
      bgColor: "bg-purple-400/10",
      borderColor: "border-purple-400/30",
      hoverBg: "group-hover:bg-purple-400/20"
    },
    {
      title: "Quote/Thought",
      description: "Save an inspiring quote or thought",
      path: "/quotes/new",
      icon: "💬",
      bgColor: "bg-pink-400/10", 
      borderColor: "border-pink-400/30",
      hoverBg: "group-hover:bg-pink-400/20"
    }
  ];
  
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
            className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-md w-full shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">What would you like to create?</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
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
                    <h4 className="font-medium text-white">{option.title}</h4>
                    <p className="text-sm text-gray-400">{option.description}</p>
                  </div>
                  <FiChevronRight className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Add these animations to globals.css
// @keyframes fadeIn {
//   from { opacity: 0; }
//   to { opacity: 1; }
// }
// @keyframes scaleIn {
//   from { transform: scale(0.95); opacity: 0; }
//   to { transform: scale(1); opacity: 1; }
// }
// .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
// .animate-scaleIn { animation: scaleIn 0.2s ease-out; } 