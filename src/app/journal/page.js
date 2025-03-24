"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";
import { FiCalendar, FiPlus } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import databaseUtils from "../../lib/database";
import Footer from "../components/Footer";

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

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <main className="max-w-4xl mx-auto pt-24 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-150"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-300"></div>
            </div>
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
          <h1 className="text-3xl font-bold">My Journal</h1>

          {user && (
            <Link
              href="/journal/new"
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <FiPlus size={16} />
              <span>New Entry</span>
            </Link>
          )}
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
                        <Link
                          href={`/journal/${entry.id}`}
                          className="text-lg font-semibold text-white hover:underline"
                        >
                          {entry.title}
                        </Link>
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

      <Footer />
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
