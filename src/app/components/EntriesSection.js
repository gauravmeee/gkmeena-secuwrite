import { useState, useEffect } from "react";
import Link from "next/link";
import { FiCalendar, FiBook, FiEdit3, FiClock, FiChevronRight } from "react-icons/fi";
import CreateFirstEntryDialog from "./CreateFirstEntryDialog";
import EntryTypeCard from "./EntryTypeCard";
import { useAuth } from "../../context/AuthContext";
import databaseUtils from "../../lib/database";

// Function to strip HTML tags for preview
const stripHtml = (html) => {
  if (typeof window === 'undefined') return '';
  if (!html) return '';
  
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

export default function EntriesSection({ viewMode, entryTypes }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anyEntryExists, setAnyEntryExists] = useState(false);
  const { user, toggleAuthModal } = useAuth();

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      try {
        let journalEntries = [];
        let diaryEntries = [];
        
        // If user is logged in, load from Supabase
        if (user) {
          // Get entries from Supabase
          const cloudJournalEntries = await databaseUtils.getJournalEntries(user.id);
          const cloudDiaryEntries = await databaseUtils.getDiaryEntries(user.id);
          
          journalEntries = cloudJournalEntries.map(entry => {
            const now = entry.created_at ? new Date(entry.created_at) : new Date();
            return {
              ...entry,
              type: "journal",
              preview: stripHtml(entry.content).substring(0, 120) + (stripHtml(entry.content).length > 120 ? '...' : ''),
              date: now.toLocaleDateString('en-US'),
              time: now.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              })
            };
          });
          
          diaryEntries = cloudDiaryEntries.map(entry => {
            const now = entry.created_at ? new Date(entry.created_at) : new Date();
            return {
              ...entry,
              type: "diary",
              preview: stripHtml(entry.content).substring(0, 120) + (stripHtml(entry.content).length > 120 ? '...' : ''),
              date: now.toLocaleDateString('en-US'),
              time: now.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              })
            };
          });
        } 
        // Otherwise fall back to localStorage
        else if (typeof window !== "undefined") {
          // Get entries from localStorage
          journalEntries = JSON.parse(localStorage.getItem("journalEntries") || "[]")
            .map(entry => {
              const now = entry.timestamp ? new Date(entry.timestamp) : new Date();
              return { 
                ...entry, 
                type: "journal",
                preview: stripHtml(entry.content).substring(0, 120) + (stripHtml(entry.content).length > 120 ? '...' : ''),
                date: now.toLocaleDateString('en-US'),
                time: now.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                })
              };
            });
          
          diaryEntries = JSON.parse(localStorage.getItem("diaryEntries") || "[]")
          .map(entry => {
            const now = entry.timestamp ? new Date(entry.timestamp) : new Date();
            return {
              ...entry,
              type: "diary",
              preview: stripHtml(entry.content).substring(0, 120) + (stripHtml(entry.content).length > 120 ? '...' : ''),
              date: now.toLocaleDateString('en-US'),
              time: now.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              })
            };
          });
        }
        
        // Combine all entries
        const allEntries = [...journalEntries, ...diaryEntries];
        
        // Check if any entries exist
        const hasAnyEntry = allEntries.length > 0;
        setAnyEntryExists(hasAnyEntry);
        
        // Sort by timestamp (newest first) and take only the 5 most recent entries
        const recentEntries = allEntries
          .sort((a, b) => {
            // First try to sort by timestamp
            if (a.timestamp && b.timestamp) {
              return b.timestamp - a.timestamp;
            }
            // Fall back to created_at for Supabase entries
            if (a.created_at && b.created_at) {
              return new Date(b.created_at) - new Date(a.created_at);
            }
            // If all else fails, use timestamp or created_at, whichever is available
            const aTime = a.timestamp || new Date(a.created_at || 0).getTime();
            const bTime = b.timestamp || new Date(b.created_at || 0).getTime();
            return bTime - aTime;
          })
          .slice(0, 6);
        
        setEntries(recentEntries);
      } catch (error) {
        console.error("Error loading entries:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadEntries();
  }, [user]);

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-150"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-300"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center max-w-md">
              {user ? (
                <>
                  <div className="flex justify-center mb-6">
                    <CreateFirstEntryDialog />
                  </div>
                  <p className="text-gray-400">You don&apos;t have any entries yet. Create your first one to get started!</p>
                </>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={toggleAuthModal}
                    className="text-primary hover:text-primary/90 text-lg font-medium transition-colors"
                  >
                    Sign in to view your entries
                  </button>
                  <p className="text-gray-400 text-sm">Create and manage your personal entries securely</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Get the appropriate icon for each entry type
//   const getEntryIcon = (type) => {
//     switch(type) {
//       case 'diary':
//         return <FiBook className="text-blue-400" />;
//       case 'journal':
//         return <FiEdit3 className="text-green-400" />;
//       default:
//         return <FiCalendar className="text-primary" />;
//     }
//   };
  
  // Get the appropriate link for each entry type
  const getEntryLink = (entry, index) => {
    // For cloud entries, use the UUID
    if (entry.id && typeof entry.id === 'string' && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.id)) {
      return `/${entry.type}/${entry.id}`;
    }
    
    // For localStorage entries, use the index
    switch(entry.type) {
      case 'diary':
        return `/diary/${index}`;
      case 'journal':
        return `/journal/${index}`;
      default:
        return '#';
    }
  };
  
  // Get the label for an entry type
  const getEntryTypeLabel = (type) => {
    switch(type) {
      case 'diary':
        return 'Diary';
      case 'journal':
        return 'Journal';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  // Get the color for an entry type
  const getEntryTypeColor = (type) => {
    switch(type) {
      case 'diary':
        return 'bg-blue-400';
      case 'journal':
        return 'bg-green-400';
      default:
        return 'bg-primary';
    }
  };

  return (
    <>
        {viewMode === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {entries.map((entry, index) => {
              const entryLink = getEntryLink(entry, index);
              const typeColor = getEntryTypeColor(entry.type);
              
              return (
                <Link 
                  key={entry.id || entry.timestamp} 
                  href={entryLink}
                  className="group"
                >
                  <div className="bg-gray-900/70 backdrop-blur-sm rounded-xl shadow-sm border border-gray-800 p-6 h-full 
                    hover:border-primary/30 hover:shadow-lg transition-all duration-200 group-hover:translate-y-[-2px]">
                    <div className="flex items-start flex-col h-full">
                      <div className="flex w-full items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${typeColor}`}></span>
                          <span className="text-sm uppercase tracking-wider text-gray-400 font-medium">
                            {getEntryTypeLabel(entry.type)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <FiClock size={12} className="mr-1" />
                          <span>
                            {entry.date && `${entry.date}`}
                            {entry.time && ` | ${entry.time}`}
                          </span>
                        </div>
                      </div>
                      
                      {entry.hasManualTitle && entry.title ? (
                        <h3 className="text-lg font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {entry.title}
                        </h3>
                      ) : entry.title ? (
                        <h3 className="text-lg font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {entry.title}
                        </h3>
                      ) : (
                        <div className="h-6 mb-2"></div> 
                      )}
                      
                      <p className="font-handwriting italic text-gray-400 text-sm line-clamp-3 mb-4 flex-grow">
                        {entry.preview}
                      </p>
                      
                      <div className="flex items-center gap-1 text-primary text-sm mt-auto pt-2 group-hover:underline">
                        <span>Read more</span>
                        <FiChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {entryTypes
              .filter(type => type.entryCount > 0)
              .map((type) => (
                <EntryTypeCard
                  key={type.title}
                  title={type.title}
                  icon={type.icon}
                  description={type.description}
                  path={type.path}
                  bgColor={type.bgColor}
                  entryCount={type.entryCount}
                />
              ))}
          </div>
        )}
      </>
  );
} 