"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import databaseUtils from "../../lib/database";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

const stripHtml = (html) => {
  if (typeof window === "undefined") return "";
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

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

const formatDateTime = (dateInput) => {
  const date = new Date(dateInput || Date.now());
  const day = date.getDate();
  const ordinalDay = day + getOrdinalSuffix(day);
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${ordinalDay} ${month} ${year} | ${time}`;
};

export default function JournalPage() {
  const [processedEntries, setProcessedEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user, toggleAuthModal } = useAuth();

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      try {
        let entries = [];

        if (user) {
          const cloudEntries = await databaseUtils.getJournalEntries(user.id);
          entries = cloudEntries;
        } else if (typeof window !== "undefined") {
          entries = JSON.parse(localStorage.getItem("journalEntries") || "[]");
        }

        const processed = entries.map((entry) => ({
          ...entry,
          preview:
            stripHtml(entry.content).substring(0, 150) +
            (stripHtml(entry.content).length > 150 ? "..." : ""),
          dateTime: formatDateTime(entry.timestamp || entry.date || Date.now()),
        }));

        setProcessedEntries(processed);
      } catch (error) {
        console.error("Error loading entries:", error);
      } finally {
        setLoading(false);
      }
    }

    loadEntries();
  }, [user]);

  const totalPages = Math.ceil(processedEntries.length / entriesPerPage);

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedEntries(new Set()); // Clear selections when toggling mode
  };

  const handleDeleteSelected = async () => {
    if (!user || selectedEntries.size === 0) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const entriesToDelete = Array.from(selectedEntries);
      const success = await databaseUtils.deleteManyJournalEntries(user.id, entriesToDelete);
      
      if (success) {
        setProcessedEntries(entries => 
          entries.filter(entry => !selectedEntries.has(entry.id))
        );
        setSelectedEntries(new Set());
        setIsSelectionMode(false); // Exit selection mode after successful deletion
        
        // Reset current page if it's now out of bounds
        const newTotalPages = Math.ceil((processedEntries.length - selectedEntries.size) / entriesPerPage);
        if (currentPage > newTotalPages) {
          setCurrentPage(newTotalPages || 1);
        }
      } else {
        throw new Error('Failed to delete entries');
      }
    } catch (error) {
      console.error("Error deleting entries:", error);
      alert("Failed to delete entries. Please try again.");
    } finally {
      setShowDeleteModal(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-black text-white">
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemType={`${selectedEntries.size} ${selectedEntries.size === 1 ? 'entry' : 'entries'}`}
      />
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Journal</h1>

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
              <Link
                href="/journal/new"
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                <FiPlus size={16} />
                <span className="hidden sm:inline">New Entry</span>
              </Link>
            )}
          </div>
        </div>

        {processedEntries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-800 border-b border-gray-700 p-8 text-center">
              <h2 className="text-xl font-medium mb-4 text-white">
                No Journal Entries Yet
              </h2>
              <p className="text-gray-300 mb-6">
                Start documenting your thoughts with rich text formatting.
              </p>
              {user ? (
                <Link
                  href="/journal/new"
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
          </div>
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
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <div className="bg-gray-800 border-b border-gray-700 p-4">
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
                          <Link
                            href={`/journal/${entry.id}`}
                            className="text-lg font-semibold text-white hover:underline"
                          >
                            {entry.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <span>{entry.dateTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-700">{entry.preview}</p>
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

    </div>
  );
}

// Pagination component remains the same as in the previous code
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