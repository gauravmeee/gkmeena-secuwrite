import { useRef, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FiChevronsDown, FiClock, FiChevronRight, FiBook, FiEdit } from "react-icons/fi";
import CreateFirstEntryDialog from "./CreateFirstEntryDialog";
import LockOverlay from "@/components/common/LockOverlay";
import Loading from "@/components/common/Loading"
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/LoadingContext";
import databaseUtils from "../lib/database";
import { stripHtml } from "../utils/textUtils";
import { SimpleCache } from "../utils/componentUtils";

// Cache for entries data
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
let entriesCache = {
  data: null,
  timestamp: null,
  userId: null
};

// Optimized cache for entry counts
const countCache = new SimpleCache(5 * 60 * 1000); // 5 minutes

export default function MainSection({ setHideFloatingButton }) {


  const [entries, setEntries] = useState([]);
  const [entryCounts, setEntryCounts] = useState({ journal: 0, diary: 0 });
  const { loading, setLoading } = useLoading(); // using custome hook 'Loading'
  const { user, toggleAuthModal } = useAuth();
  const dialogRef = useRef(null); // to hide floating button  when <CreateFirstEntryDialog/> is in viewport

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

  // Scroll Detection logic, to Hide Floating Button when <CreateFirstEntryDialog/> is in viewport
useEffect(() => {
  function handleScroll() {
    // If no user, don't hide the button
    if (!user) {
      setHideFloatingButton(false);
      return;
    }

    // If user has entries, don't hide the button (no dialog to check)
    if (entries.length > 0) {
      setHideFloatingButton(false);
      return;
    }

    // If user has no entries, check if the CreateFirstEntryDialog is in viewport
    if (dialogRef.current) {
      const rect = dialogRef.current.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      setHideFloatingButton(inView);
    } else {
      // If dialogRef is not available yet, don't hide the button
      setHideFloatingButton(false);
    }
  }

  window.addEventListener("scroll", handleScroll);
  handleScroll(); // initial check
  return () => window.removeEventListener("scroll", handleScroll);
}, [dialogRef, setHideFloatingButton, user, entries.length]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (!user) {
          setLoading(false);
          return;
        }

        let allEntries = [];

        // Check entries cache first
        if (entriesCache.data &&
          entriesCache.timestamp &&
          Date.now() - entriesCache.timestamp < CACHE_TIME &&
          entriesCache.userId === user.id) {
          allEntries = entriesCache.data;
        } else {
          // Get both types of entries in parallel
          const [journalEntries, diaryEntries] = await Promise.all([
            databaseUtils.getJournalEntries(user.id),
            databaseUtils.getDiaryEntries(user.id)
          ]);

          allEntries = [
            ...journalEntries.map(entry => formatEntry(entry, 'journal')),
            ...diaryEntries.map(entry => formatEntry(entry, 'diary'))
          ];

          // Update entries cache
          entriesCache = {
            data: allEntries,
            timestamp: Date.now(),
            userId: user.id
          };

          // Update entry counts
          const counts = {
            journal: journalEntries.length,
            diary: diaryEntries.length,
          };

          // Cache the counts
          const cacheKey = `entryCounts_${user.id}`;
          countCache.set(cacheKey, counts);
          setEntryCounts(counts);
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
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, formatEntry]);

  // // Check for any entries
  // const hasAnyEntries = Object.values(entryCounts).some(count => count > 0);

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
    }
  };



  // ------- Scroll button component -------
  function ScrollButton({ currentState }) {
    const [scrollY, setScrollY] = useState(0);
    const maxScroll = typeof window !== 'undefined' ? window.innerHeight * 0.3 : 300;

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
    const iconTranslateY = t < fadeStart ? 0 : 10 * ((t - fadeStart) / (1 - fadeStart));

    // ------- Scroll button JSX -------
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
              {currentState}
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


  // ------- Sign In Prompt -------
  function NoUserState({ toggleAuthModal }) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center px-4">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FiBook className="text-white text-3xl" />
          </div>
          <h2 className="text-2xl text-foreground mb-4">Welcome to Your Writing Space</h2>
          <p className="text-text-secondary text-base mb-8 leading-relaxed">
            Sign in to create and manage your personal entries securely. Your thoughts, your stories, your journey.
          </p>
          <div className="flex justify-center">
            <button
              onClick={toggleAuthModal}
              className="btn-writing px-8 py-3 text-base font-medium rounded-lg transition-all hover:scale-105 shadow-md hover:shadow-lg"
            >
              Sign in to get started
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------- Create First Entry Dialog -------
  function EmptyState({ user, toggleAuthModal, dialogRef }) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center px-4">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FiEdit className="text-white text-3xl" />
          </div>
          <h2 className="text-2xl text-foreground mb-4">Ready to Begin?</h2>
          <p className="text-text-secondary text-base mb-8 leading-relaxed">
            Your writing journey starts here. Create your first entry and let your thoughts flow onto the page.
          </p>
          <div className="flex justify-center">
          <CreateFirstEntryDialog ref={dialogRef} />
          </div>
        </div>
      </div>
    );
  }
  // ------- Recen Entries -------
  function RecentEntries({
    entries,
    getEntryTypeLabel,
    getEntryTypeColor,
    getEntryLink
  }) {
    // ------- Recent Entries JSX -------
    return (
      // ---- Entries grid ----
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entries.map((entry, index) => {
          const entryLink = getEntryLink(entry, index);
          const typeColor = getEntryTypeColor(entry.type);
          return (
            <div key={entry.id || entry.timestamp} className="group h-full">

              {/* ---- Locke Overlay ---- */}
              <LockOverlay entryType={entry.type} className="h-full">
                <div
                  className={`rounded-xl p-4 h-full transition-all group-hover:translate-y-[-1px] bg-bg-overlay backdrop-blur-[10px] shadow-sm border border-border-primary hover:shadow-md`}
                >
                  {/* ---- Entry Link ---- */}
                  <Link href={entryLink} className="block h-full">
                    <div className="flex items-start flex-col h-full">
                      <div className="flex w-full items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${typeColor}`}></span>
                          <span className="text-sm uppercase tracking-wider font-medium text-text-secondary">
                            {getEntryTypeLabel(entry.type)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-text-secondary">
                          <FiClock size={12} className="mr-1" />
                          <span>
                            {entry.date && `${entry.date}`}
                            {entry.time && ` | ${entry.time}`}
                          </span>
                        </div>
                      </div>

                      {entry.title ? (
                        <h3 className="text-base font-semibold mb-3 text-text-secondary group-hover:text-primary transition-colors line-clamp-2">
                          {entry.title}
                        </h3>
                      ) : (
                        <div className="h-6 mb-2"></div>
                      )}

                      <p className="italic text-sm line-clamp-3 mb-4 flex-grow text-text-secondary">
                        {entry.preview}
                      </p>

                      <div className="flex items-center gap-1 text-primary text-sm group-hover:underline">
                        <span>Read more</span>
                        <FiChevronRight
                          size={14}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </Link>
                </div>
              </LockOverlay>
            </div>
          );
        })}
      </div>
    );
  }

  // Show loading while data is being loaded
  if (loading) {
    return <Loading />;
  }


  // ------- Main JSX (Recent Entries) -------
  return (
    <div className="w-full min-h-[75vh] flex flex-col">
      {/* Heading (always visible) */}
      <ScrollButton
        currentState={
          !user ? 'Start Your Writing Journey' :
            entries.length === 0 ? 'Create Your First Entry' :
              'Your Recent Entries'
        }
      />

      {/* Entries Grid */}
      <div className="max-w-7xl py-10 mx-auto px-4 sm:px-6 md:px-8">

        {!user ? (
          <NoUserState toggleAuthModal={toggleAuthModal} />
        ) : (
          entries.length === 0 ? (
            // Empty state
            <EmptyState user={user} toggleAuthModal={toggleAuthModal} dialogRef={dialogRef} />
          ) : (
            <RecentEntries
              entries={entries}
              getEntryTypeLabel={getEntryTypeLabel}
              getEntryTypeColor={getEntryTypeColor}
              getEntryLink={getEntryLink}
            />
          )
        )}
      </div>
    </div>
  );
}

