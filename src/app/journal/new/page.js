"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";
import dynamic from "next/dynamic";
import databaseUtils from "../../../lib/database";

// Dynamically import JoditEditor for SSR compatibility
const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

function NewJournalEntryContent() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const isTypingRef = useRef(false);
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const mounted = useRef(false);
  const editorRef = useRef(null);
  const draftTimerRef = useRef(null);

  // Update authentication check
  useEffect(() => {
    // Wait a bit to ensure auth is initialized
    const timer = setTimeout(() => {
      setAuthChecked(true);
      if (!user) {
        router.push('/');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, router]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Load draft content when component mounts
  useEffect(() => {
    if (user) {
      const editDraftId = searchParams.get('editDraft');
      
      if (editDraftId) {
        // Editing a specific draft - clear any session flags first
        sessionStorage.removeItem(`journal_new_session_${user.id}`);
        
        const drafts = JSON.parse(localStorage.getItem(`journal_drafts_${user.id}`) || '[]');
        const currentDraft = drafts.find(d => d.timestamp === editDraftId);
        
        if (currentDraft) {
          setTitle(currentDraft.title || '');
          setContent(currentDraft.content || '');
          if (editorRef.current) {
            editorRef.current.value = currentDraft.content || '';
          }
          
          // Mark this draft as currently being edited
          const updatedDrafts = drafts.map(d => ({
            ...d,
            isCurrentlyEditing: d.timestamp === currentDraft.timestamp
          }));
          localStorage.setItem(`journal_drafts_${user.id}`, JSON.stringify(updatedDrafts));
        }
      } else {
        // Check if user is intentionally creating new or refreshing while writing
        const isIntentionallyNew = sessionStorage.getItem(`journal_new_session_${user.id}`);
        
        if (isIntentionallyNew === 'true') {
          // User intentionally clicked "New Entry" - start blank
          // Clear any currently editing flags
          const drafts = JSON.parse(localStorage.getItem(`journal_drafts_${user.id}`) || '[]');
          const updatedDrafts = drafts.map(d => ({ ...d, isCurrentlyEditing: false }));
          localStorage.setItem(`journal_drafts_${user.id}`, JSON.stringify(updatedDrafts));
          
          // Reset form to blank state
          setTitle('');
          setContent('');
          if (editorRef.current) {
            editorRef.current.value = '';
          }
          
          // Clear the session flag
          sessionStorage.removeItem(`journal_new_session_${user.id}`);
        } else {
          // Check if there's a draft that was being edited (for refresh scenarios)
          const drafts = JSON.parse(localStorage.getItem(`journal_drafts_${user.id}`) || '[]');
          const currentDraft = drafts.find(d => d.isCurrentlyEditing);
          
          if (currentDraft) {
            // Load the currently editing draft (for refresh scenarios)
            setTitle(currentDraft.title || '');
            setContent(currentDraft.content || '');
            if (editorRef.current) {
              editorRef.current.value = currentDraft.content || '';
            }
          } else {
            // No draft being edited - start blank
            setTitle('');
            setContent('');
            if (editorRef.current) {
              editorRef.current.value = '';
            }
          }
        }
      }
    }
  }, [user, searchParams]);

  // Save draft when title changes (silent - no status updates)
  useEffect(() => {
    const saveDraft = () => {
      if (!user || !editorRef.current) return;

      const currentContent = editorRef.current.value;
      
      // Only save if there's content (title or content)
      if (title || currentContent) {
        try {
          const drafts = JSON.parse(localStorage.getItem(`journal_drafts_${user.id}`) || '[]');
          
          // Find currently editing draft
          const currentDraft = drafts.find(d => d.isCurrentlyEditing);
          
          if (currentDraft) {
            // Update existing draft
            const updatedDrafts = drafts.map(d => {
              if (d.isCurrentlyEditing) {
                return {
                  ...d,
                  title: title || "",
                  content: currentContent || "",
                  lastModified: new Date().getTime()
                  // Keep original timestamp to avoid creating duplicates
                };
              }
              return d;
            });
            localStorage.setItem(`journal_drafts_${user.id}`, JSON.stringify(updatedDrafts));
          } else {
            // Create new draft
            const newDraft = {
              userId: user.id,
              title: title || "",
              content: currentContent || "",
              timestamp: new Date().toISOString(),
              lastModified: new Date().getTime(),
              isCurrentlyEditing: true,
              date: new Date().toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }),
              day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
              time: new Date().toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })
            };
            
            // Remove editing flag from all other drafts
            const otherDrafts = drafts.map(d => ({ ...d, isCurrentlyEditing: false }));
            localStorage.setItem(`journal_drafts_${user.id}`, JSON.stringify([newDraft, ...otherDrafts]));
          }
          
          // Silent saving - no status updates to avoid re-renders
          
        } catch (error) {
          console.error('Error saving draft:', error);
        }
      }
    };

    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
    }

    draftTimerRef.current = setTimeout(saveDraft, 1000);

    return () => {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
      }
    };
  }, [title, user]); // Only trigger on title changes

  // Save draft immediately when page is about to unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        const currentContent = editorRef.current ? editorRef.current.value : '';
        if (title || currentContent) {
          try {
            const drafts = JSON.parse(localStorage.getItem(`journal_drafts_${user.id}`) || '[]');
            const currentDraft = drafts.find(d => d.isCurrentlyEditing);
            
            if (currentDraft) {
              // Update existing draft
              const updatedDrafts = drafts.map(d => {
                if (d.isCurrentlyEditing) {
                  return {
                    ...d,
                    title: title || "",
                    content: currentContent || "",
                    lastModified: new Date().getTime()
                    // Keep original timestamp to avoid creating duplicates
                  };
                }
                return d;
              });
              localStorage.setItem(`journal_drafts_${user.id}`, JSON.stringify(updatedDrafts));
            } else {
              // Create new draft
              const newDraft = {
                userId: user.id,
                title: title || "",
                content: currentContent || "",
                timestamp: new Date().toISOString(),
                lastModified: new Date().getTime(),
                isCurrentlyEditing: true,
                date: new Date().toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }),
                day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
                time: new Date().toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })
              };

              const otherDrafts = drafts.map(d => ({ ...d, isCurrentlyEditing: false }));
              localStorage.setItem(`journal_drafts_${user.id}`, JSON.stringify([newDraft, ...otherDrafts]));
            }
          } catch (error) {
            console.error('Error saving draft on unload:', error);
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [title, user]); // Removed content from dependencies

  // Don't clear the currently editing flag when leaving the page
  // This ensures drafts persist across page refreshes and navigation
  // The flag will only be cleared when the draft is saved or deleted

  const clearDraft = () => {
    if (user) {
      const drafts = JSON.parse(localStorage.getItem(`journal_drafts_${user.id}`) || '[]');
      const currentDraft = drafts.find(d => d.isCurrentlyEditing);
      if (!currentDraft) return;

      const filteredDrafts = drafts.filter(d => !d.isCurrentlyEditing);
      localStorage.setItem(`journal_drafts_${user.id}`, JSON.stringify(filteredDrafts));
    }
  };

  // Show loading state while checking auth
  if (!authChecked || !user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <main className="max-w-6xl mx-auto pt-24 px-6">
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

  const handleSave = async () => {
    // Get content from state or editor
    const editorContent = content || editorRef.current?.value || "";
    
    // Check if content is empty or only contains whitespace/HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorContent;
    const textContent = tempDiv.textContent || tempDiv.innerText;
    
    if (!textContent || !textContent.trim()) {
      alert("Please write something before saving");
      return;
    }

    if (!user) {
      alert("Please log in to save your journal entry");
      return;
    }

    try {
      setLoading(true);

      // Create the entry object with all necessary fields
      const newEntry = {
        title: title.trim() || "Untitled",
        content: editorContent,
        date: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      };

      // Use databaseUtils to create the entry (this will handle encryption)
      const result = await databaseUtils.createJournalEntry(user.id, newEntry);

      if (!result) {
        throw new Error("Failed to save journal entry");
      }

      // Clear the draft after successful save
      clearDraft();
      router.push("/journal");

    } catch (error) {
      console.error("Error saving entry:", error);
      alert(error.message || "Could not save entry. Please try again.");
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const editorConfig = {
    readonly: false,
    placeholder: "Write your journal entry here...",
    toolbarSticky: false,
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    spellcheck: true,
    minHeight: 400,
    height: "auto",
    buttons: [
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "|",
      "ul",
      "ol",
      "|",
      "font",
      "fontsize",
      "brush",
      "link",
      "unlink",
      "image",
      "video",
      "|",
      "align",
      "outdent",
      "indent",
      "undo",
      "redo",
      "|",
      "hr",
      "fullsize",
      "selectall",
      "source",
    ],
    statusbar: false,
    removeButtons: ['source', 'fullsize', 'about'],
    uploader: {
      insertImageAsBase64URI: true
    },
    events: {
      afterInit: function(editor) {
        editorRef.current = editor;
        // Set initial content if available
        if (content) {
          editor.value = content;
        }
        
        // Add event listener to trigger draft saving
        editor.events.on('change', () => {
          // Mark as typing without causing re-render
          isTypingRef.current = true;
          
          // Clear any existing timer
          if (draftTimerRef.current) {
            clearTimeout(draftTimerRef.current);
          }
          
          // Set timer for draft saving
          draftTimerRef.current = setTimeout(() => {
            if (user && editorRef.current) {
              const currentContent = editorRef.current.value;
              if (title || currentContent) {
                try {
                  const drafts = JSON.parse(localStorage.getItem(`journal_drafts_${user.id}`) || '[]');
                  const currentDraft = drafts.find(d => d.isCurrentlyEditing);
                  
                  if (currentDraft) {
                    const updatedDrafts = drafts.map(d => {
                      if (d.isCurrentlyEditing) {
                        return {
                          ...d,
                          title: title || "",
                          content: currentContent || "",
                          lastModified: new Date().getTime()
                          // Keep original timestamp to avoid creating duplicates
                        };
                      }
                      return d;
                    });
                    localStorage.setItem(`journal_drafts_${user.id}`, JSON.stringify(updatedDrafts));
                  } else {
                    const newDraft = {
                      userId: user.id,
                      title: title || "",
                      content: currentContent || "",
                      timestamp: new Date().toISOString(),
                      lastModified: new Date().getTime(),
                      isCurrentlyEditing: true,
                      date: new Date().toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }),
                      day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
                      time: new Date().toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })
                    };
                    
                    const otherDrafts = drafts.map(d => ({ ...d, isCurrentlyEditing: false }));
                    localStorage.setItem(`journal_drafts_${user.id}`, JSON.stringify([newDraft, ...otherDrafts]));
                  }
                  
                  // Mark as not typing after a delay
                  setTimeout(() => {
                    isTypingRef.current = false;
                  }, 2000);
                  
                } catch (error) {
                  console.error('Error saving draft:', error);
                }
              }
            }
          }, 1000);
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-6xl mx-auto pt-24 px-4 pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              href={searchParams.get('editDraft') ? "/journal/draft" : "/journal"} 
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <FiArrowLeft size={18} />
              <span>Back</span>
            </Link>


          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className={`flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg transition-all duration-300${
              loading
                ? "bg-opacity-70 cursor-not-allowed"
                : "hover:bg-primary/90 cursor-pointer"
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                <span className="hidden sm:inline">Saving...</span>
              </div>
            ) : (
              <>
                <FiSave size={18} />
                <span className="hidden sm:inline">Save Entry</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-4 sm:p-6">
          {/* Title Input */}
          <div className="relative w-full mb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              className="w-full text-3xl font-semibold p-2 pr-36 rounded-lg border border-gray-700 bg-transparent text-white focus:outline-none focus:border-primary transition-all"
            />
            <span className="absolute right-4 top-4 text-gray-400 text-sm">
              {new Date().toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Editor */}
          <div className="bg-white rounded-md text-black overflow-hidden shadow-md">
            <JoditEditor
              key="new-journal-editor"
              config={editorConfig}
              tabIndex={1}
              ref={editorRef}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

// Main component with Suspense boundary
export default function NewJournalEntry() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 text-white">
        <main className="max-w-6xl mx-auto pt-24 px-4 pb-20">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-150"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-300"></div>
            </div>
          </div>
        </main>
      </div>
    }>
      <NewJournalEntryContent />
    </Suspense>
  );
}