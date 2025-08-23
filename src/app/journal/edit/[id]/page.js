"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import EntryLockProtection from "../../../../components/EntryLockProtection";
import { useAuth } from "../../../../context/AuthContext";
import { supabase } from "../../../../lib/supabase";
import dynamic from "next/dynamic";
import databaseUtils from "../../../../lib/database";

// Dynamically import JoditEditor for SSR compatibility
const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

export default function EditJournalEntry() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const mounted = useRef(false);
  const editorRef = useRef(null);
  const initialContentRef = useRef("");

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

  useEffect(() => {
    async function loadEntry() {
      if (!user || !params.id) return;

      try {
        // Use databaseUtils to get the entry (this will handle decryption)
        const entry = await databaseUtils.getJournalEntry(params.id, user.id);

        if (!entry) {
          throw new Error("Entry not found");
        }

        setTitle(entry.title || "");
        // Store the initial content in ref to set it once editor is initialized
        initialContentRef.current = entry.content || "";
        console.log("Loading content:", initialContentRef.current); // Debug log
      } catch (error) {
        console.error("Error loading entry:", error);
        alert("Could not load the entry. Please try again.");
        router.push("/journal");
      } finally {
        setLoading(false);
      }
    }

    if (authChecked && user) {  // Only load entry after auth check
      loadEntry();
    }
  }, [params.id, user, router, authChecked]);  // Add authChecked to dependencies

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
      setSaving(true);

      const updatedEntry = {
        title: title.trim() || "Untitled",
        content: editorContent
      };

      // Use databaseUtils to update the entry (this will handle encryption)
      const result = await databaseUtils.updateJournalEntry(params.id, updatedEntry, user.id);

      if (!result) {
        throw new Error("Failed to update journal entry");
      }

      router.push("/journal");
    } catch (error) {
      console.error("Error updating entry:", error);
      alert("Could not update entry. Please try again.");
    } finally {
      if (mounted.current) {
        setSaving(false);
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
        // Set initial content from ref after editor is initialized
        if (initialContentRef.current) {
          editor.value = initialContentRef.current;
        }
      }
    }
  };

  if (!authChecked || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-primary/10 to-secondary/30 text-foreground">
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

  return (
    <EntryLockProtection entryType="journal">
      <div className="min-h-screen bg-background text-foreground">
        <main className="max-w-6xl mx-auto pt-24 px-4 pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <Link href={`/journal/${params.id}`} className="flex items-center gap-2 text-primary hover:underline">
            <FiArrowLeft size={18} />
            <span>Back</span>
          </Link>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className={`flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg transition-all duration-300${
              saving || loading
                ? "bg-opacity-70 cursor-not-allowed"
                : "hover:bg-primary/90 cursor-pointer"
            }`}
          >
            {saving ? (
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
                Saving...
              </div>
            ) : (
              <>
                <FiSave size={18} />
                <span className="hidden sm:inline">Save Changes</span>
              </>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-150"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-300"></div>
            </div>
          </div>
        ) : (
          <div className="bg-bg-primary rounded-xl shadow-lg border border-border-primary p-4 sm:p-6">
            {/* Title Input */}
            <div className="relative w-full mb-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                className="w-full text-3xl font-semibold p-2 pr-36 rounded-lg border border-border-primary bg-transparent text-text-primary focus:outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Editor */}
            <div className="bg-white rounded-md text-black overflow-hidden shadow-md">
              <JoditEditor
                key="edit-journal-editor"
                config={editorConfig}
                tabIndex={1}
                ref={editorRef}
              />
            </div>
          </div>
        )}
        </main>
      </div>
    </EntryLockProtection>
  );
}