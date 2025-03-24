"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";
import { FiCalendar, FiPlus, FiTrash2 } from "react-icons/fi";
import Footer from "../components/Footer";
import { useAuth } from "../../context/AuthContext";
import databaseUtils from "../../lib/database";

// Function to strip HTML tags for preview
const stripHtml = (html) => {
  if (typeof window === 'undefined') return '';
  if (!html) return '';
  
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

export default function DiaryPage() {
  const [processedEntries, setProcessedEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const { user, toggleAuthModal } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      try {
        let entries = [];
        
        // If user is logged in, load from Supabase
        if (user) {
          const cloudEntries = await databaseUtils.getDiaryEntries(user.id);
          entries = cloudEntries;
        } 
        // Otherwise fall back to localStorage
        else if (typeof window !== "undefined") {
          entries = JSON.parse(localStorage.getItem("diaryEntries") || "[]");
        }
        
        // Create processed entries with preview text and ensure date/time fields
        const processed = entries.map(entry => {
          const now = new Date(entry.timestamp || Date.now());
          
          // Function to add ordinal suffix to day
          const getOrdinalSuffix = (day) => {
            if (day > 3 && day < 21) return 'th';
            switch (day % 10) {
              case 1: return 'st';
              case 2: return 'nd';
              case 3: return 'rd';
              default: return 'th';
            }
          };
          
          const day = now.getDate();
          const ordinalDay = day + getOrdinalSuffix(day);
          
          return {
            ...entry,
            preview: stripHtml(entry.content).substring(0, 150) + (stripHtml(entry.content).length > 150 ? '...' : ''),
            date: entry.date || `${ordinalDay} ${now.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}`,
            day: entry.day || now.toLocaleDateString('en-US', { weekday: 'long' }),
            time: entry.time || now.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit', 
              hour12: true 
            })
          };
        });
        
        setProcessedEntries(processed);
      } catch (error) {
        console.error("Error loading entries:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadEntries();
  }, [user]);

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedEntries(new Set()); // Clear selections when toggling mode
  };

  const handleDeleteSelected = async () => {
    if (!user || selectedEntries.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedEntries.size} entries?`)) {
      try {
        const entriesToDelete = Array.from(selectedEntries);
        const success = await databaseUtils.deleteManyDiaryEntries(user.id, entriesToDelete);
        
        if (success) {
          setProcessedEntries(entries => 
            entries.filter(entry => !selectedEntries.has(entry.id))
          );
          setSelectedEntries(new Set());
          setIsSelectionMode(false); // Exit selection mode after successful deletion
        } else {
          throw new Error('Failed to delete entries');
        }
      } catch (error) {
        console.error("Error deleting entries:", error);
        alert("Failed to delete entries. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <main className="max-w-4xl mx-auto pt-24 px-4">
          <div className="flex justify-center items-center h-64">
            <p className="text-xl">Loading diary entries...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Diary</h1>
          
          <div className="flex gap-2">
            {user && processedEntries.length > 0 && (
              <>
                <button
                  onClick={handleToggleSelectionMode}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    isSelectionMode 
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  <FiTrash2 size={18} />
                  {isSelectionMode ? 'Cancel' : 'Delete Multiple'}
                </button>

                {isSelectionMode && selectedEntries.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    <FiTrash2 size={18} />
                    Delete ({selectedEntries.size})
                  </button>
                )}
              </>
            )}
            
            {user && (
              <Link 
                href="/diary/new" 
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                <FiPlus size={16} />
                <span>New Entry</span>
              </Link>
            )}
          </div>
        </div>
        
        {processedEntries.length === 0 ? (
          <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-8 text-center">
            <h2 className="text-xl font-medium mb-4">No Diary Entries Yet</h2>
            <p className="text-gray-400 mb-6">Start recording your daily thoughts and experiences.</p>
            {user ? (
              <Link 
                href="/diary/new" 
                className="inline-flex items-center gap-2 bg-primary text-white px-4 py-3 rounded-md hover:bg-primary/90 transition-colors"
              >
                <FiPlus size={16} />
                <span>Create Your First Entry</span>
              </Link>
            ) : (
              <button 
                onClick={toggleAuthModal}
                className="inline-flex items-center gap-2 bg-primary text-white px-4 py-3 rounded-md hover:bg-primary/90 transition-colors"
              >
                <FiPlus size={16} />
                <span>Sign In to Create Entry</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5">
              {processedEntries
                .slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)
                .map((entry) => (
                  <div key={entry.id || entry.timestamp} className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
                    <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isSelectionMode && (
                            <input
                              type="checkbox"
                              checked={selectedEntries.has(entry.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedEntries);
                                if (e.target.checked) {
                                  newSelected.add(entry.id);
                                } else {
                                  newSelected.delete(entry.id);
                                }
                                setSelectedEntries(newSelected);
                              }}
                              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                            />
                          )}
                          <Link href={`/diary/${entry.id}`}>
                            <h2 className="text-xl font-semibold hover:text-primary transition-colors text-gray-800">
                              {entry.title}
                            </h2>
                          </Link>
                        </div>
                        
                        <div className="font-handwriting text-gray-800">
                          {entry.date} | {entry.time}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start justify-between gap-4 p-5 lined-paper bg-white">
                      <div className="flex-1 text-gray-800">
                        <Link href={`/diary/${entry.id || entry.timestamp}`} className="block">
                          <p className="pt-2 font-handwriting text-xl">
                            {entry.preview}
                          </p>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            
            {processedEntries.length > entriesPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(processedEntries.length / entriesPerPage)}
                onPageChange={(page) => setCurrentPage(page)}
              />
            )}
          </>
        )}
      </main>
      
      <Footer />
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&display=swap');
        
        .font-handwriting {
          font-family: 'Caveat', 'Dancing Script', cursive;
        }
        
        .lined-paper {
          background-color: white;
          background-image: 
            linear-gradient(90deg, transparent 39px, #d6aed6 39px, #d6aed6 41px, transparent 41px),
            linear-gradient(#e5e7eb 1px, transparent 1px);
          background-size: 100% 2rem;
          background-position: 0 0;
          line-height: 2rem;
          padding-left: 45px !important;
        }
      `}</style>
    </div>
  );
}

// Add this helper function to generate page numbers array
function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  
  if (totalPages <= 7) {
    // If total pages is 7 or less, show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);
    
    if (currentPage > 3) {
      // Add ellipsis if current page is away from start
      pages.push('...');
    }
    
    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(currentPage + 1, totalPages - 1); i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      // Add ellipsis if current page is away from end
      pages.push('...');
    }
    
    // Always show last page
    pages.push(totalPages);
  }
  
  return pages;
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = getPageNumbers(currentPage, totalPages);
  
  return (
    <div className="flex justify-center items-center gap-2 mt-8 mb-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-md bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        Previous
      </button>
      
      <div className="flex gap-1">
        {pages.map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={page === currentPage}
              className={`px-3 py-2 rounded-md transition-colors ${
                page === currentPage
                  ? 'bg-primary text-white'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {page}
            </button>
          )
        ))}
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-md bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        Next
      </button>
    </div>
  );
} 