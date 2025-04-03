"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiPlus, FiTrash2, FiX, FiCamera } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import databaseUtils from "../../lib/database";
import { supabase } from "../../lib/supabase";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import NoEntriesState from "../components/NoEntriesState";

// Function to strip HTML tags for preview
const stripHtml = (html) => {
  if (typeof window === "undefined") return "";
  if (!html) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

export default function DiaryPage() {
  const [processedEntries, setProcessedEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user, toggleAuthModal } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [imageUrls, setImageUrls] = useState({});

  // Function to get signed URL for an image
  const getSignedUrl = async (imageUrl) => {
    if (!imageUrl || imageUrl.startsWith('data:image/')) {
      return imageUrl;
    }

    try {
      // Extract the path from the full URL if it's a full Supabase URL
      let path = imageUrl;
      if (imageUrl.includes('diary-images/')) {
        path = imageUrl.split('diary-images/')[1];
      }

      console.log('Attempting to get signed URL for path:', path);

      const { data, error } = await supabase
        .storage
        .from('diary-images')
        .createSignedUrl(path, 3600);

      if (error) {
        console.error('Error getting signed URL:', error);
        // If the error is "Object not found", try using the full URL
        if (error.message.includes('Object not found')) {
          console.log('Object not found, trying with full URL');
          return imageUrl;
        }
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDExMEwxMzAgMTQwSDEwMFYxODBIMTAwVjE0MEg3MFYxMTBIMTAwWiIgZmlsbD0iI0E1QjVCMiIvPjwvc3ZnPg==';
      }

      if (!data?.signedUrl) {
        console.error('No signed URL returned from Supabase');
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDExMEwxMzAgMTQwSDEwMFYxODBIMTAwVjE0MEg3MFYxMTBIMTAwWiIgZmlsbD0iI0E1QjVCMiIvPjwvc3ZnPg==';
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDExMEwxMzAgMTQwSDEwMFYxODBIMTAwVjE0MEg3MFYxMTBIMTAwWiIgZmlsbD0iI0E1QjVCMiIvPjwvc3ZnPg==';
    }
  };

  // Load signed URLs for all images
  useEffect(() => {
    async function loadSignedUrls() {
      if (!user) return;

      const urls = {};
      for (const entry of processedEntries) {
        if (entry.image_url && !entry.image_url.startsWith('data:image/')) {
          urls[entry.id] = await getSignedUrl(entry.image_url);
        }
      }
      setImageUrls(urls);
    }

    loadSignedUrls();
  }, [processedEntries, user]);

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
        const processed = entries.map((entry) => {
          const now = new Date(entry.timestamp || Date.now());

          // Function to add ordinal suffix to day
          const getOrdinalSuffix = (day) => {
            if (day > 3 && day < 21) return "th";
            switch (day % 10) {
              case 1:
                return "st";
              case 2:
                return "nd";
              case 3:
                return "rd";
              default:
                return "th";
            }
          };

          const day = now.getDate();
          const ordinalDay = day + getOrdinalSuffix(day);

          return {
            ...entry,
            preview:
              stripHtml(entry.content).substring(0, 150) +
              (stripHtml(entry.content).length > 150 ? "..." : ""),
            date:
              entry.date ||
              `${ordinalDay} ${now.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}`,
            day:
              entry.day || now.toLocaleDateString("en-US", { weekday: "long" }),
            time:
              entry.time ||
              now.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }),
            entryType: entry.image_url ? 'image' : 'text'
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
          // Find the entry to get its image URL
          const entryToDelete = processedEntries.find(e => e.id === entryId);
          
          // Delete image from Supabase storage if it exists
          if (entryToDelete?.image_url && !entryToDelete.image_url.startsWith('data:image/')) {
            try {
              // Extract the path from the full URL if it's a full Supabase URL
              let path = entryToDelete.image_url;
              if (entryToDelete.image_url.includes('diary-images/')) {
                path = entryToDelete.image_url.split('diary-images/')[1];
              } else if (entryToDelete.image_url.includes('storage.googleapis.com')) {
                // Extract path from full Supabase URL
                const urlParts = entryToDelete.image_url.split('/');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <main className="max-w-4xl mx-auto pt-24 px-4">
          <div className="flex justify-center items-center h-64">
            <p className="text-xl">Loading diary entries...</p>
          </div>
        </main>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">My Diary</h1>

          <div className="flex gap-2">
            {user && processedEntries.length > 0 && (
              <>
                <button
                  onClick={handleToggleSelectionMode}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors cursor-pointer ${
                    isSelectionMode
                      ? "bg-gray-600 text-white hover:bg-gray-700"
                      : "bg-red-600 text-white hover:bg-red-700"
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
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors cursor-pointer"
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
                  className="flex items-center gap-2 text-white px-4 py-2 hover:bg-primary/90 transition-colors"
                >
                  <FiPlus size={16} />
                  <span className="hidden sm:inline">New Entry</span>
                </Link>
                <div className="h-6 w-px bg-white/30"></div>
                <Link
                  href="/diary/new?type=image"
                  className="flex items-center gap-2 text-white px-4 py-2 hover:bg-primary/90 transition-colors"
                >
                  <FiCamera size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {processedEntries.length === 0 ? (
          <NoEntriesState type="Diary" />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5">
              {processedEntries
                .slice(
                  (currentPage - 1) * entriesPerPage,
                  currentPage * entriesPerPage
                )
                .map((entry) => (
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
                    <div className={entry.entryType === 'image' ? 'bg-white p-8' : 'lined-paper flex items-start justify-between gap-4 p-5 bg-white'}>
                      <div className="flex-1 text-gray-800">
                        <Link
                          href={`/diary/${entry.id || entry.timestamp}`}
                          className="block"
                        >
                          {entry.image_url ? (
                            <div className="space-y-4">
                              <img
                                src={imageUrls[entry.id] || entry.image_url}
                                alt="Diary entry"
                                className="w-full max-h-48 object-cover object-top rounded-lg shadow-sm"
                                onError={(e) => {
                                  console.warn('Image loading error:', {
                                    src: e.target.src,
                                    originalUrl: entry.image_url
                                  });
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDExMEwxMzAgMTQwSDEwMFYxODBIMTAwVjE0MEg3MFYxMTBIMTAwWiIgZmlsbD0iI0E1QjVCMiIvPjwvc3ZnPg==';
                                }}
                              />
                              {entry.preview && (
                                <p className="pt-2 font-handwriting text-xl">
                                  {entry.preview}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="pt-2 font-handwriting text-xl">
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
              totalPages={Math.ceil(processedEntries.length / entriesPerPage)}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </main>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&display=swap");

        .font-handwriting {
          font-family: "Caveat", "Dancing Script", cursive;
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
