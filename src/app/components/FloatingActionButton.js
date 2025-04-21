"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiBook, FiEdit, FiFeather, FiMusic, FiMessageCircle, FiX } from "react-icons/fi";

export default function FloatingActionButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  
  // Close modal when clicking outside 
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isModalOpen && !e.target.closest('.fab-container')) {
        setIsModalOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isModalOpen]);
  
  const toggleModal = (e) => {
    e.stopPropagation();
    setIsModalOpen(!isModalOpen);
  };
  
  const navigateTo = (path) => {
    setIsModalOpen(false);
    router.push(path);
  };
  
  const entryTypes = [
    { name: "Diary", icon: <FiEdit />, path: "/diary/new" },
    { name: "Journal", icon: <FiBook />, path: "/journal/new" },
    // { name: "Story", icon: <FiFeather />, path: "/stories/new" },
    // { name: "Song/Poem", icon: <FiMusic />, path: "/songs/new" },
    // { name: "Quote/Thought", icon: <FiMessageCircle />, path: "/quotes/new" },
  ];
  
  return (
    <div className="fab-container">
      <button
        onClick={toggleModal}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl hover:bg-primary/90 transition-all z-30 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        {isModalOpen ? <FiX size={24} /> : <FiPlus size={24} />}
      </button>
      
      {isModalOpen && (
        <div className="fixed bottom-24 right-6 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-4 w-64 z-20 fab-container transform transition-all duration-200 ease-out">
          <h3 className="text-lg font-semibold mb-3 text-white">Create New</h3>
          <div className="grid gap-1">
            {entryTypes.map((type) => (
              <button
                key={type.name}
                onClick={() => navigateTo(type.path)}
                className="flex items-center gap-3 p-3 rounded-md transition-all duration-150 hover:bg-gray-800 group w-full text-left"
              >
                <span className="text-primary group-hover:text-white transition-colors">{type.icon}</span>
                <span className="group-hover:translate-x-1 transition-transform duration-150">{type.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 