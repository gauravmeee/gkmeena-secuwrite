"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// import { FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { useLock } from "@/context/LockContext";
import databaseUtils from "@/lib/database";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import NoEntriesState from "@/components/common/NoEntriesState";
import SignInPrompt from "@/components/common/SignInPrompt";
// import LoadingSpinner from "@/components/common/LoadingSpinner";
import LockOverlay from "@/components/common/LockOverlay";
import { useRouter } from "next/navigation";

// Added
import Pagination from "@/components/common/Pagination";
import Loading from "@/components/common/Loading";
import { NewEntryButton, DeleteEntriesButton } from "@/components/common/ActionButtons";
import { DraftsViewButton } from "@/components/common/LinkButtons";

// const stripHtml = (html) => {
//   if (typeof window === "undefined") return "";
//   if (!html) return "";
//   const doc = new DOMParser().parseFromString(html, "text/html");
//   return doc.body.textContent || "";
// };

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

// Function to strip HTML and format preview
const generatePreview = (content) => {
  if (!content) return { text: "", imageUrl: null };
  
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  
  // Remove script and style elements
  const scripts = tempDiv.getElementsByTagName('script');
  const styles = tempDiv.getElementsByTagName('style');
  while(scripts[0]) scripts[0].parentNode.removeChild(scripts[0]);
  while(styles[0]) styles[0].parentNode.removeChild(styles[0]);
  
  // Add size constraints to images
  const images = tempDiv.getElementsByTagName('img');
  for (let img of images) {
    img.style.maxWidth = '150px';
    img.style.maxHeight = '100px';
    img.style.objectFit = 'cover';
    img.style.margin = '0.5rem 0';
  }
  
  // Get text content
  let textContent = tempDiv.textContent || tempDiv.innerText;
  
  // Handle videos
  const videos = tempDiv.getElementsByTagName('video');
  if (videos.length > 0) {
    textContent = `[${videos.length} video${videos.length > 1 ? 's' : ''}] ${textContent}`;
  }
  
  // Split into lines and take first 5
  const lines = textContent.split('\n').filter(line => line.trim());
  const previewLines = lines.slice(0, 5);
  
  // Join lines with proper spacing
  return {
    text: previewLines.join('\n'),
    content: tempDiv.innerHTML // Keep the HTML content for proper image rendering
  };
};

export default function JournalPage() {
  const [processedEntries, setProcessedEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user} = useAuth();
  const { isUnlocked, lockJournal} = useLock();
  const [entries, setEntries] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [draftsCount, setDraftsCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Load journal entries
        const journalEntries = await databaseUtils.getJournalEntries(user.id);
        setEntries(journalEntries || []);

        // Process entries for display
        const processed = (journalEntries || []).map((entry) => ({
          ...entry,
          preview: generatePreview(entry.content),
          dateTime: formatDateTime(entry.timestamp || entry.date || Date.now()),
        }));

        setProcessedEntries(processed);

        // Count drafts
        const drafts = JSON.parse(localStorage.getItem(`journal_drafts_${user.id}`) || '[]');
        setDraftsCount(drafts.length);

      } catch (error) {
        console.error("Error loading journal entries:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // Refresh draft count when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        const drafts = JSON.parse(localStorage.getItem(`journal_drafts_${user.id}`) || '[]');
        setDraftsCount(drafts.length);
      }
    };

    const handleFocus = () => {
      if (user) {
        const drafts = JSON.parse(localStorage.getItem(`journal_drafts_${user.id}`) || '[]');
        setDraftsCount(drafts.length);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
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

  // ------- Loading -------
  if (loading) {
    return (
      <Loading/>
    );
  }

 // ------- Sign In Prompt -------
  if (!user) {
    return <SignInPrompt type="Journal" />;
  }

  // ------- No Entries -------
  if(user && processedEntries.length === 0 && draftsCount==0){
    return(
      <NoEntriesState type="Journal" />
    )
  }

  {/* ------------------------------ Main JSX -------------------------- */}

  return (
    //  ------- Main Page ------- 
    <div className="min-h-screen text-text-primary bg-background">
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemType={`${selectedEntries.size} ${selectedEntries.size === 1 ? 'entry' : 'entries'}`}
      />
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">My Journal</h1>


            {/* -- Draft Button -- */}
            {user && draftsCount > 0 && (
              <DraftsViewButton 
              draftsCount = {draftsCount}
              entryType={"journal"}
            />
            )}
          </div>

          <div className="flex flex-wrap gap-2">

            {/* -- Delete Button --*/}
            {user && processedEntries.length > 0 && (!lockJournal || isUnlocked) && (
              <DeleteEntriesButton
                isSelectionMode = {isSelectionMode}
                selectedEntries = {selectedEntries}
                handleToggleSelectionMode = {handleToggleSelectionMode}
                handleDeleteSelected = {handleDeleteSelected}
              />
            )}

            {/* -- New Entry Button -- */}
            {user && !isSelectionMode && (
              <NewEntryButton
                user = {user}
                entryType = {"journal"}
              />
            )}

          </div>
        </div>

            <div className="grid grid-cols-1 gap-5">
              {processedEntries
                .slice(
                  (currentPage - 1) * entriesPerPage,
                  currentPage * entriesPerPage
                )
                .map((entry) => (

                  // ------- Locke Overlay -------
                  <LockOverlay key={entry.id || entry.timestamp} entryType="journal">

                    {/* ------- Journal Preview Container ------- */}
                    <div
                      className="bg-bg-primary rounded-xl shadow-sm border border-border-primary overflow-hidden transition-all group-hover:translate-y-[-1px] hover:shadow-md"
                    >
                      {/* ------- Journal Preview - Header ------- */}
                      <div className="bg-bg-secondary border-b border-border-primary p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">

                            {/* -- Multiple Delete Selection Mode -- */}
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
                                className="w-4 h-4"
                              />
                            )}

                            {/* -- Title -- XL */}
                            <Link href={`/journal/${entry.id}`}>
                            <h2 className="text-xl font-semibold hover:text-primary">
                              {entry.title}
                            </h2>
                            </Link>

                          </div>

                          {/* -- DateTime --*/}
                          <div className="text-text-secondary">
                            {entry.dateTime}
                          </div>

                        </div>
                      </div>

                      <div className="p-4">
                        <Link
                          href={`/journal/${entry.id}`}
                          className="block"
                        >
                          {/* ------- Journal Preview Container - Body ------- */}
                          <div className="prose prose-gray max-w-none">
                          <div
                              className="
                              overflow-hidden
                              [display:-webkit-box]
                              [-webkit-box-orient:vertical]
                              [-webkit-line-clamp:5]
                              [line-clamp:5]
                              leading-6
                              [&_*]:!m-0
                              [&_*]:!p-0
                              [&_h1]:!text-base
                              [&_h2]:!text-base
                              [&_h3]:!text-base
                              [&_h4]:!text-base
                              [&_h5]:!text-base
                              [&_h6]:!text-base
                              [&_p]:!mb-1
                              [&_p]:!leading-6
                              [&_ul]:!mb-1
                              [&_ol]:!mb-1
                              [&_li]:!mb-0
                              [&_blockquote]:!mb-1
                              [&_img]:max-w-[200px] 
                              [&_img]:max-h-[150px] 
                              [&_img]:object-cover 
                              [&_img]:my-2
                              [&_br]:hidden
                              [&_div]:!block
                            "
                              dangerouslySetInnerHTML={{ __html: entry.preview.content }}
                            />
                          </div>
                        </Link>

                      </div>
                    </div>
                  </LockOverlay>
                ))}
            </div>

            {/* -- Paignation --*/}
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(processedEntries.length / entriesPerPage)}
              onPageChange={(page) => setCurrentPage(page)}
            />

      </main>
    </div>
  );
}

// // Pagination component remains the same as in the previous code
// function getPageNumbers(currentPage, totalPages) {
//   const pages = [];
  
//   if (totalPages <= 7) {
//     for (let i = 1; i <= totalPages; i++) {
//       pages.push(i);
//     }
//   } else {
//     pages.push(1);
    
//     if (currentPage > 3) {
//       pages.push('...');
//     }
    
//     for (let i = Math.max(2, currentPage - 1); i <= Math.min(currentPage + 1, totalPages - 1); i++) {
//       pages.push(i);
//     }
    
//     if (currentPage < totalPages - 2) {
//       pages.push('...');
//     }
    
//     pages.push(totalPages);
//   }
  
//   return pages;
// }

// function Pagination({ currentPage, totalPages, onPageChange }) {
//   const pages = getPageNumbers(currentPage, totalPages);
  
//   return (
//     <div className="flex justify-center items-center gap-2 mt-8 mb-4">
//       <button
//         onClick={() => onPageChange(currentPage - 1)}
//         disabled={currentPage === 1}
//         className="px-3 py-2 rounded-md bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
//       >
//         Previous
//       </button>
      
//       <div className="flex gap-1">
//         {pages.map((page, index) => (
//           page === '...' ? (
//             <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
//               ...
//             </span>
//           ) : (
//             <button
//               key={page}
//               onClick={() => onPageChange(page)}
//               disabled={page === currentPage}
//               className={`px-3 py-2 rounded-md transition-colors ${
//                 page === currentPage
//                   ? 'bg-primary text-white'
//                   : 'bg-gray-900 text-white hover:bg-gray-800'
//               }`}
//             >
//               {page}
//             </button>
//           )
//         ))}
//       </div>
      
//       <button
//         onClick={() => onPageChange(currentPage + 1)}
//         disabled={currentPage === totalPages}
//         className="px-3 py-2 rounded-md bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
//       >
//         Next
//       </button>
//     </div>
//   );
// }