"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import databaseUtils from "../../../lib/database";
import dynamic from "next/dynamic";

// Dynamically import JoditEditor for SSR compatibility
const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

export default function NewJournalEntry() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleSave = async () => {
    if (!content.trim()) return;

    try {
      setLoading(true);

      const newEntry = {
        title: title.trim() || "Untitled",
        content,
        date: new Date().toISOString().split("T")[0],
        timestamp: Date.now(),
      };

      if (user) {
        await databaseUtils.createJournalEntry(user.id, newEntry);
      } else {
        const existingEntries = JSON.parse(localStorage.getItem("journalEntries") || "[]");
        existingEntries.unshift(newEntry);
        localStorage.setItem("journalEntries", JSON.stringify(existingEntries));
      }

      router.push("/journal");
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Could not save entry. Please try again.");
    } finally {
      setLoading(false);
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
    minHeight: 600,  
    height: "calc(100vh - 250px)",  
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
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-6xl mx-auto pt-24 px-6 pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/journal" className="flex items-center gap-2 text-primary hover:underline">
            <FiArrowLeft size={18} />
            <span>Back to Journal</span>
          </Link>

          <button
            onClick={handleSave}
            disabled={loading}
            className={`flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg transition-all duration-300 ${
              loading
                ? "bg-opacity-70 cursor-not-allowed"
                : "hover:bg-primary/90"
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
                Saving...
              </div>
            ) : (
              <>
                <FiSave size={18} />
                <span className="hidden sm:inline">Save Entry</span>
              </>
            )}
          </button>
        </div>

        {/* Journal Form */}
        <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-8">
          {/* Title Input */}
          <div className="relative w-full mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              className="w-full text-3xl font-semibold p-4 pr-36 rounded-lg border border-gray-700 bg-transparent text-white focus:outline-none focus:border-primary transition-all"
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
          <div
            className="bg-white rounded-md text-black overflow-hidden shadow-md"
            style={{ height: "calc(100vh - 300px)" }}
          >
            <JoditEditor
              value={content}
              onChange={setContent}
              config={editorConfig}
              tabIndex={1}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
