"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";
import dynamic from "next/dynamic";
import databaseUtils from "../../../lib/database";

// Dynamically import JoditEditor for SSR compatibility
const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

export default function NewJournalEntry() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
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
      const drafts = JSON.parse(localStorage.getItem('journal_drafts') || '[]');
      // Get the most recent draft that was being edited
      const currentDraft = drafts.find(d => d.isCurrentlyEditing);
      
      if (currentDraft) {
        setTitle(currentDraft.title || '');
        if (editorRef.current) {
          editorRef.current.value = currentDraft.content || '';
        }
      }
    }
  }, [user]);

  // Save draft while typing
  useEffect(() => {
    const saveDraft = () => {
      if (!user || !editorRef.current) return;

      const content = editorRef.current.value;
      const drafts = JSON.parse(localStorage.getItem('journal_drafts') || '[]');
      
      // Find currently editing draft
      const currentDraft = drafts.find(d => d.isCurrentlyEditing);
      
      if (currentDraft) {
        // Update existing draft
        const updatedDrafts = drafts.map(d => {
          if (d.isCurrentlyEditing) {
            return {
              ...d,
              title: title || "",
              content: content || "",
              timestamp: new Date().toISOString()
            };
          }
          return d;
        });
        localStorage.setItem('journal_drafts', JSON.stringify(updatedDrafts));
      } else {
        // Create new draft
        const newDraft = {
          userId: user.id,
          title: title || "",
          content: content || "",
          timestamp: new Date().toISOString(),
          isCurrentlyEditing: true
        };
        
        // Remove editing flag from all other drafts
        const otherDrafts = drafts.map(d => ({ ...d, isCurrentlyEditing: false }));
        localStorage.setItem('journal_drafts', JSON.stringify([newDraft, ...otherDrafts]));
      }
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
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
  }, [title, user]);

  // Clear draft when component unmounts
  useEffect(() => {
    return () => {
      if (user) {
        const drafts = JSON.parse(localStorage.getItem('journal_drafts') || '[]');
        const updatedDrafts = drafts.map(d => ({ ...d, isCurrentlyEditing: false }));
        localStorage.setItem('journal_drafts', JSON.stringify(updatedDrafts));
      }
    };
  }, [user]);

  const clearDraft = () => {
    if (user) {
      const drafts = JSON.parse(localStorage.getItem('journal_drafts') || '[]');
      const currentDraft = drafts.find(d => d.isCurrentlyEditing);
      if (!currentDraft) return;

      const filteredDrafts = drafts.filter(d => !d.isCurrentlyEditing);
      localStorage.setItem('journal_drafts', JSON.stringify(filteredDrafts));
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
    // Get content directly from the editor
    const editorContent = editorRef.current?.value || "";
    
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
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-6xl mx-auto pt-24 px-4 pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/journal" className="flex items-center gap-2 text-primary hover:underline">
              <FiArrowLeft size={18} />
              <span>Back to Journal</span>
            </Link>
            {draftSaved && (
              <span className="text-sm text-gray-400">
                Draft saved
              </span>
            )}
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