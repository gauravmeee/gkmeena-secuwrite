"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiPlus, FiTrash2, FiX, FiCamera, FiEdit2, FiImage } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useLock } from "../../context/LockContext";
import databaseUtils from "../../lib/database";
import { supabase } from "../../lib/supabase";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import NoEntriesState from "../components/NoEntriesState";
import SignInPrompt from "../components/SignInPrompt";
import { useRouter } from "next/navigation";

// Function to strip HTML tags for preview
const stripHtml = (html) => {
  if (typeof window === "undefined") return "";
  if (!html) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

// Function to format date with ordinal suffix
const getOrdinalSuffix = (day) => {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
};

export default function DiaryPage() {
  const [processedEntries, setProcessedEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user, toggleAuthModal } = useAuth();
  const { shouldBlur } = useLock();
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [draftsCount, setDraftsCount] = useState(0);
  const router = useRouter();

  // Load entries
  useEffect(() => {
    async function loadEntries() {
      if (!user) {
        setLoading(false);
        return;
      }

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

        // Process entries with preview text and ensure date/time fields
        const processed = entries.map((entry) => {
          const now = new Date(entry.timestamp || entry.created_at || Date.now());
          const day = now.getDate();
          const ordinalDay = day + getOrdinalSuffix(day);

          // Generate preview text based on entry type
          let previewText = '';
          if (entry.entry_type === 'image') {
            previewText = '[Image Entry]';
          } else {
            const strippedContent = stripHtml(entry.content);
            previewText = strippedContent.substring(0, 150) + (strippedContent.length > 150 ? "..." : "");
          }

          return {
            ...entry,
            preview: previewText,
            date: entry.date || `${ordinalDay} ${now.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}`,
            day: entry.day || now.toLocaleDateString("en-US", { weekday: "long" }),
            time: entry.time || now.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
            displayTitle: entry.title || "",
            displayDate: entry.date || "No date",
            displayTime: entry.time || "No time"
          };
        });

        // Sort entries by timestamp, newest first
        const sortedEntries = processed.sort((a, b) => {
          const aTime = a.timestamp || new Date(a.created_at || 0).getTime();
          const bTime = b.timestamp || new Date(b.created_at || 0).getTime();
          return bTime - aTime;
        });

        setProcessedEntries(sortedEntries);
      } catch (error) {
        console.error("Error loading entries:", error);
      } finally {
        setLoading(false);
      }
    }

    loadEntries();
  }, [user]);

  // Load drafts count separately
  useEffect(() => {
    if (user) {
      const drafts = JSON.parse(localStorage.getItem(`diary_drafts_${user.id}`) || "[]");
      setDraftsCount(drafts.length);
    }
  }, [user]);

  // Show loading while entries are being loaded
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <main className="max-w-4xl mx-auto pt-24 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-150"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-300"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show sign in prompt if not authenticated
  if (!user) {
    return <SignInPrompt type="Diary" />;
  }

  // Calculate pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = processedEntries.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(processedEntries.length / entriesPerPage);

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedEntries(new Set()); // Clear selections when toggling mode
  };

  const handleDeleteSelected = async () => {
    if (!user || selectedEntries.size === 0) return;
    setShowDeleteModal(true);
  };

  const confirmDeleteSelected = async () => {
    try {
      const entriesToDelete = Array.from(selectedEntries);
      const selectedEntriesData = processedEntries.filter(entry => selectedEntries.has(entry.id));

      // Delete images from Supabase storage first
      for (const entry of selectedEntriesData) {
        if (entry.image_url && !entry.image_url.startsWith('data:image/')) {
          try {
            // Extract the path from the full URL if it's a full Supabase URL
            let path = entry.image_url;
            if (entry.image_url.includes('diary-images/')) {
              path = entry.image_url.split('diary-images/')[1];
            } else if (entry.image_url.includes('storage.googleapis.com')) {
              // Extract path from full Supabase URL
              const urlParts = entry.image_url.split('/');
              path = urlParts.slice(urlParts.indexOf('diary-images') + 1).join('/');
            }

            console.log('Attempting to delete image from storage:', path);
            
            // First check if the file exists
            const { data: exists } = await supabase
              .storage
              .from('diary-images')
              .list(path.split('/').slice(0, -1).join('/'));

            if (exists) {
              const { error: storageError } = await supabase
                .storage
                .from('diary-images')
                .remove([path]);

              if (storageError) {
                console.error('Error deleting image from storage:', storageError);
                // Try alternative path format
                const altPath = path.replace(/^[^/]+\//, '');
                console.log('Trying alternative path:', altPath);
                const { error: altError } = await supabase
                  .storage
                  .from('diary-images')
                  .remove([altPath]);

                if (altError) {
                  console.error('Error deleting image with alternative path:', altError);
                }
              }
            } else {
              console.log('Image file not found in storage:', path);
            }
          } catch (error) {
            console.error('Error deleting image from storage:', error);
            // Continue with entry deletion even if image deletion fails
          }
        }
      }

      // Delete entries from Supabase
      const success = await databaseUtils.deleteManyDiaryEntries(user.id, entriesToDelete);

      if (success) {
        setProcessedEntries((entries) =>
          entries.filter((entry) => !selectedEntries.has(entry.id))
        );
        setSelectedEntries(new Set());
        setIsSelectionMode(false); // Exit selection mode after successful deletion
      } else {
        throw new Error("Failed to delete entries");
      }
    } catch (error) {
      console.error("Error deleting entries:", error);
      alert("Failed to delete entries. Please try again.");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleDelete = async (entryId) => {
    try {
      if (user) {
        // Check if this is a UUID (Supabase ID)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entryId);
        
        if (isUuid) {
          // Delete entry from Supabase
          await databaseUtils.deleteDiaryEntry(entryId, user.id);
          
          // Update local state
          setProcessedEntries((entries) => entries.filter(e => e.id !== entryId));
          return;
        }
      }
      
      // Fall back to localStorage
      const updatedEntries = processedEntries.filter(e => e.id !== entryId);
      localStorage.setItem("diaryEntries", JSON.stringify(updatedEntries));
      setProcessedEntries(updatedEntries);
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Could not delete entry. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <DeleteConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteSelected}
        itemType={`${selectedEntries.size} diary ${selectedEntries.size === 1 ? 'entry' : 'entries'}`}
      />
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">My Diary</h1>
            {user && draftsCount > 0 && (
              <Link
                href="/diary/draft"
                className="text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <span>Drafts</span>
                <span className="bg-red-100 text-red-500 px-2 py-0.5 rounded text-sm">
                  {draftsCount}
                </span>
              </Link>
            )}
          </div>

          <div className="flex gap-2">
            {user && processedEntries.length > 0 && (
              <>
                <button
                  onClick={handleToggleSelectionMode}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors cursor-pointer border-2 ${
                    isSelectionMode
                      ? "bg-gray-600 text-white hover:bg-gray-700 border-transparent"
                      : "border-green-500 text-green-500 hover:border-green-400 hover:text-green-400 bg-gray-800/40"
                  }`}
                >
                  {isSelectionMode ? <FiX size={18} /> : <FiTrash2 size={18} />}
                  <span className="hidden sm:inline">
                    {isSelectionMode ? "Cancel" : "Delete Multiple"}
                  </span>
                </button>

                {isSelectionMode && selectedEntries.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors cursor-pointer border-2 border-transparent"
                  >
                    <FiTrash2 size={18} />
                    <span className="hidden sm:inline">Delete</span> ({selectedEntries.size})
                  </button>
                )}
              </>
            )}

            {user && (
              <div className="flex items-center bg-primary rounded-md overflow-hidden">
                <Link
                  href="/diary/new?type=text"
                  onClick={() => {
                    if (user) {
                      sessionStorage.setItem(`diary_new_session_${user.id}`, 'true');
                    }
                  }}
                  className="flex items-center gap-2 text-white px-4 py-2 hover:bg-primary/90 transition-colors"
                >
                  <FiPlus size={16} />
                  <span className="hidden sm:inline">New Entry</span>
                </Link>
                <div className="h-6 w-px bg-white/30"></div>
                <Link
                  href="/diary/new?type=image"
                  onClick={() => {
                    if (user) {
                      sessionStorage.setItem(`diary_new_session_${user.id}`, 'true');
                    }
                  }}
                  className="flex items-center gap-2 text-white px-4 py-2 hover:bg-primary/90 transition-colors"
                >
                  <FiCamera size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {!loading && processedEntries.length === 0 ? (
          <NoEntriesState type="Diary" />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5">
              {currentEntries.map((entry) => (
                <div
                  key={entry.id || entry.timestamp}
                  className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden"
                >
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
                        {entry.displayTitle && (
                          entry.isDraft ? (
                            <Link href="/diary/draft/edit">
                              <h2 className="text-xl font-semibold hover:text-primary transition-colors text-gray-800">
                                {entry.displayTitle}
                                <span className="ml-2 text-sm font-normal text-red-500 bg-red-100 px-2 py-0.5 rounded">
                                  Draft
                                </span>
                              </h2>
                            </Link>
                          ) : (
                            <Link href={`/diary/${entry.id}`}>
                              <h2 className="text-xl font-semibold hover:text-primary transition-colors text-gray-800">
                                {entry.displayTitle}
                              </h2>
                            </Link>
                          )
                        )}
                      </div>

                      <div className="font-handwriting text-gray-800">
                        {entry.displayDate} | {entry.displayTime}
                      </div>
                    </div>
                  </div>
                  <div className={entry.entry_type === 'image' ? 'bg-white p-8' : 'lined-paper flex items-start justify-between gap-4 p-5 bg-white'}>
                    <div className="flex-1 text-gray-800">
                      <Link
                        href={`/diary/${entry.id}`}
                        className="block"
                      >
                        {entry.entry_type === 'image' ? (
                          <div className="space-y-4">
                            <img
                              src={entry.content}
                              alt="Diary entry"
                              className={`w-full max-h-48 object-cover object-top rounded-lg shadow-sm ${
                                shouldBlur('diary') ? 'blur-md' : ''
                              }`}
                              onError={(e) => {
                                console.warn('Image loading error:', {
                                  src: e.target.src
                                });
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDExMEwxMzAgMTQwSDEwMFYxODBIMTAwVjE0MEg3MFYxMTBIMTAwWiIgZmlsbD0iI0E1QjVCMiIvPjwvc3ZnPg==';
                              }}
                            />
                          </div>
                        ) : (
                          <p className={`pt-2 font-handwriting text-xl ${
                            shouldBlur('diary') ? 'blur-sm' : ''
                          }`}>
                            {entry.preview}
                          </p>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </main>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&family=Kalam&display=swap");

        .font-handwriting {
          font-family: "Kalam", "Caveat", "Dancing Script", cursive;
        }

        .lined-paper {
          background-color: white;
          background-image: linear-gradient(
              90deg,
              transparent 39px,
              #d6aed6 39px,
              #d6aed6 41px,
              transparent 41px
            ),
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

// Add Pagination component
function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('...');
    }
    
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(currentPage + 1, totalPages - 1); i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
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
