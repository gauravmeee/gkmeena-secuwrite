import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FiChevronsDown, FiClock, FiChevronRight } from "react-icons/fi";
import CreateFirstEntryDialog from "./CreateFirstEntryDialog";
import LockOverlay from "./LockOverlay";
import { useAuth } from "../../context/AuthContext";
import { useLock } from "../../context/LockContext";
import databaseUtils from "../../lib/database";
import { stripHtml } from "../../utils/textUtils";

// Cache for entries data
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
let entriesCache = {
  data: null,
  timestamp: null,
  userId: null
};

export default function EntriesSection({ viewMode, entryTypes }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anyEntryExists, setAnyEntryExists] = useState(false);
  const { user, toggleAuthModal } = useAuth();
  const { shouldBlur } = useLock();

  // Memoized function to format entry data
  const formatEntry = useMemo(() => (entry, type) => {
    const now = entry.created_at ? new Date(entry.created_at) : new Date(entry.timestamp || Date.now());
    return {
      ...entry,
      type,
      preview: type === 'diary' && entry.entry_type === 'image'
        ? '[Image]'
        : stripHtml(entry.content).substring(0, 120) + (stripHtml(entry.content).length > 120 ? '...' : ''),
      date: now.toLocaleDateString('en-US'),
      time: now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  }, []);

  useEffect(() => { 
    async function loadEntries() {
      setLoading(true);
      try {
        let allEntries = [];

        // Check cache first
        if (user &&
          entriesCache.data &&
          entriesCache.timestamp &&
          Date.now() - entriesCache.timestamp < CACHE_TIME &&
          entriesCache.userId === user.id) {
          allEntries = entriesCache.data;
        } else {
          // If user is logged in, load from Supabase
          if (user) {
            // Get both types of entries in parallel
            const [journalEntries, diaryEntries] = await Promise.all([
              databaseUtils.getJournalEntries(user.id),
              databaseUtils.getDiaryEntries(user.id)
            ]);

            allEntries = [
              ...journalEntries.map(entry => formatEntry(entry, 'journal')),
              ...diaryEntries.map(entry => formatEntry(entry, 'diary'))
            ];

            // Update cache
            entriesCache = {
              data: allEntries,
              timestamp: Date.now(),
              userId: user.id
            };
          }
          // Otherwise fall back to localStorage
          else if (typeof window !== "undefined") {
            const journalEntries = JSON.parse(localStorage.getItem("journalEntries") || "[]")
              .map(entry => formatEntry(entry, 'journal'));

            const diaryEntries = JSON.parse(localStorage.getItem("diaryEntries") || "[]")
              .map(entry => formatEntry(entry, 'diary'));

            allEntries = [...journalEntries, ...diaryEntries];
          }
        }

        // Sort by timestamp (newest first) and take only the 6 most recent entries
        const recentEntries = allEntries
          .sort((a, b) => {
            const aTime = a.timestamp || new Date(a.created_at || 0).getTime();
            const bTime = b.timestamp || new Date(b.created_at || 0).getTime();
            return bTime - aTime;
          })
          .slice(0, 6);

        setEntries(recentEntries);
        setAnyEntryExists(recentEntries.length > 0);
      } catch (error) {
        console.error("Error loading entries:", error);
      } finally {
        setLoading(false);
      }
    }

    loadEntries();
  }, [user, formatEntry]);

  // Get the appropriate link for each entry type
  const getEntryLink = (entry, index) => {
    // For cloud entries, use the UUID
    if (entry.id && typeof entry.id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.id)) {
      return `/${entry.type}/${entry.id}`;
    }

    // For localStorage entries, use the index
    return `/${entry.type}/${index}`;
  };

  // Get the label for an entry type
  const getEntryTypeLabel = (type) => {
    switch (type) {
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
    switch (type) {
      case 'diary':
        return 'bg-secondary';
      case 'journal':
        return 'bg-primary';
      case 'stories':
        return 'bg-accent';
      case 'songs':
        return 'bg-secondary';
      case 'quotes':
        return 'bg-accent';
      default:
        return 'bg-primary';
    }
  };


  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse"></div>
          <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-150"></div>
          <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-300"></div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="text-center max-w-md">
          {user ? (
            <>
              <div className="flex justify-center mb-4">
                <CreateFirstEntryDialog />
              </div>
              <p className="text-gray-400 text-sm">You don&apos;t have any entries yet. Create your first one to get started!</p>
            </>
          ) : (
            <div className="space-y-3">
              <button
                onClick={toggleAuthModal}
                className="text-primary hover:text-primary/90 text-base font-medium transition-colors"
              >
                Sign in to view your entries
              </button>
              <p className="text-gray-400 text-xs">Create and manage your personal entries securely</p>
            </div>
          )}
        </div>
      </div>
    );
  }

// scroll button inside EntriesSection

function ScrollButton() {
  const [scrollY, setScrollY] = useState(0);
  const maxScroll = window.innerHeight * 0.3; // threshold for full animation

  useEffect(() => {
    function onScroll() {
      setScrollY(window.scrollY);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Clamp scroll position between 0 and maxScroll
  const clampedScroll = Math.min(scrollY, maxScroll);

  // Normalize scroll progress 0 → 1
  const t = clampedScroll / maxScroll;

  // Heading scales from 1 → 1.1 linearly over entire scroll range
  const scale = 1 + 0.1 * t;

  // Font size (in rem) from 1.5 (2xl) → 1.65 (a bit smaller grow for better feel)
  const fontSizeRem = 1.5 + 0.15 * t;

  // Arrow icon stays fully visible until 80% scroll, then fades from 1 → 0
  const fadeStart = 0.8; // 80% scroll
  const iconOpacity = t < fadeStart ? 1 : 1 - (t - fadeStart) / (1 - fadeStart);

  // Arrow moves down from 0 → 10px only during fade out
  const iconTranslateY = t < fadeStart ? 0 : 10 * ( (t - fadeStart) / (1 - fadeStart) );

  return (
    <button
      onClick={() =>
        window.scrollTo({ top: window.innerHeight * 0.78, behavior: "smooth" })
      }
      className="h-[10vh] min-h-[10vh] flex items-center justify-center relative overflow-hidden pt-6 pb-2"
      aria-label="Scroll down"
    >
      <div className="text-center flex items-center gap-3">
        <div className="text-left">
          <h2
            className="font-bold"
            style={{
              fontSize: `${fontSizeRem}rem`,
              transform: `scale(${scale})`,
              transformOrigin: "left center",
              transition: "font-size 0.1s, transform 0.1s",
            }}
          >
            Recent Entries
          </h2>
        </div>
        <span
          className="flex justify-center items-center"
          style={{
            opacity: iconOpacity,
            transform: `translateY(${iconTranslateY}px)`,
            transition: "opacity 0.3s, transform 0.3s",
            pointerEvents: iconOpacity === 0 ? "none" : "auto",
          }}
        >
          <FiChevronsDown className="w-10 h-10 text-primary" />
        </span>
      </div>
    </button>
  );
}


  return (
    <div className="w-full min-h-[75vh] flex flex-col">

      {/* Lower Row - Recent Entries Button (acts as heading + button) */}
      <ScrollButton />


      {/* Recent Entries Grid - Below the button*/}
        <div className="max-w-7xl py-10 mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry, index) => {
              const entryLink = getEntryLink(entry, index);
              const typeColor = getEntryTypeColor(entry.type);

              return (
                <div key={entry.id || entry.timestamp} className="group h-full">
                  <LockOverlay entryType={entry.type} className="h-full">
                    <div className={`rounded-xl shadow-sm border p-4 h-full transition-all duration-200 group-hover:translate-y-[-2px] ${shouldBlur(entry.type)
                        ? 'bg-white border-gray-300 hover:shadow-lg'
                        : 'bg-gray-900/70 backdrop-blur-sm border-gray-800 hover:border-primary/30 hover:shadow-lg'
                      }`}>
                      <Link href={entryLink} className="block h-full">
                        <div className="flex items-start flex-col h-full">
                          <div className="flex w-full items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${typeColor}`}></span>
                              <span className={`text-sm uppercase tracking-wider font-medium ${shouldBlur(entry.type) ? 'text-gray-600' : 'text-gray-400'
                                }`}>
                                {getEntryTypeLabel(entry.type)}
                              </span>
                            </div>
                            <div className={`flex items-center text-sm ${shouldBlur(entry.type) ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                              <FiClock size={12} className="mr-1" />
                              <span>
                                {entry.date && `${entry.date}`}
                                {entry.time && ` | ${entry.time}`}
                              </span>
                            </div>
                          </div>

                          {entry.hasManualTitle && entry.title ? (
                            <h3 className={`text-base font-medium mb-2 group-hover:text-primary transition-colors line-clamp-2 ${shouldBlur(entry.type) ? 'text-gray-800' : 'text-white'
                              }`}>
                              {entry.title}
                            </h3>
                          ) : entry.title ? (
                            <h3 className={`text-lg font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2 ${shouldBlur(entry.type) ? 'text-gray-800' : 'text-white'
                              }`}>
                              {entry.title}
                            </h3>
                          ) : (
                            <div className="h-6 mb-2"></div>
                          )}

                          <p className={`font-handwriting italic text-sm line-clamp-3 mb-4 flex-grow ${shouldBlur(entry.type) ? 'text-gray-600' : 'text-gray-400'
                            }`}>
                            {entry.preview}
                          </p>

                          <div className="flex items-center gap-1 text-primary text-sm group-hover:underline">
                            <span>Read more</span>
                            <FiChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </Link>
                    </div>
                  </LockOverlay>
                </div>
              );
            })}
          </div>
        </div>

    </div>
  );
} 