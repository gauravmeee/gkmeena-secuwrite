"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiSave, FiTrash2, FiEdit2 } from "react-icons/fi";
import EntryLockProtection from "../../components/EntryLockProtection";
import { useAuth } from "../../../context/AuthContext";
import databaseUtils from "../../../lib/database";
export default function DraftDiaryPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Check authentication first
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true);
      if (!user) {
        router.push('/');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, router]);

  // Load drafts when component mounts and user is authenticated
  useEffect(() => {
    if (user && authChecked) {
      const storedDrafts = JSON.parse(localStorage.getItem(`diary_drafts_${user.id}`) || "[]");
      setDrafts(storedDrafts);
      setLoading(false);
    }
  }, [user, authChecked]);

  const handleSave = async (draft) => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      // Create a new entry in the database
      const newEntry = {
        title: draft.title,
        content: draft.content,
        date: draft.date,
        time: draft.time,
        day: draft.day,
        timestamp: new Date().getTime(),
        entry_type: draft.entry_type || 'text'
      };

      // Handle image entries
      if (draft.entry_type === 'image' && draft.content) {
        newEntry.imageFile = null; // We'll use the base64 content directly
        newEntry.imageUrl = draft.content; // Use the base64 data as imageUrl
      }

      const result = await databaseUtils.createDiaryEntry(user.id, newEntry);
      
      if (result) {
        // Remove this draft from localStorage
        const updatedDrafts = drafts.filter(d => 
          d.timestamp !== draft.timestamp
        );
        localStorage.setItem(`diary_drafts_${user.id}`, JSON.stringify(updatedDrafts));
        setDrafts(updatedDrafts);
        
        if (updatedDrafts.length === 0) {
          // If no more drafts, go back to diary
          router.push("/diary");
        }
      } else {
        throw new Error("Failed to save entry");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Could not save entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (draft) => {
    if (!user) return;
    
    try {
      // Remove this draft from localStorage
      const updatedDrafts = drafts.filter(d => 
        d.timestamp !== draft.timestamp
      );
      localStorage.setItem(`diary_drafts_${user.id}`, JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);
      
      if (updatedDrafts.length === 0) {
        router.push("/diary");
      }
    } catch (error) {
      console.error("Error deleting draft:", error);
      alert("Could not delete draft. Please try again.");
    }
  };

  const handleEdit = (draft) => {
    // Navigate to the appropriate page based on entry type with editDraft parameter
    if (draft.entry_type === 'image') {
      router.push(`/diary/new?type=image&editDraft=${draft.timestamp}`);
    } else {
      router.push(`/diary/new?editDraft=${draft.timestamp}`);
    }
  };

  if (!authChecked || loading) {
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

  if (drafts.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <main className="max-w-4xl mx-auto pt-24 px-4">
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <p className="text-xl">No drafts found</p>
            <Link href="/diary" className="text-primary hover:underline">
              Return to Diary
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <EntryLockProtection entryType="diary">
      <div className="min-h-screen bg-black text-white">
        <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <Link href="/diary" className="flex items-center gap-2 text-primary hover:underline">
            <FiArrowLeft size={16} />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">My Drafts</h1>
            <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
              {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
            </span>
          </div>
        </div>

        {/* Draft Warning Message */}
        <div className="mb-4 text-xs text-yellow-400/80 flex items-center gap-1.5">
          <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Drafts are stored locally and won&apos;t sync across devices</span>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {drafts.map((draft, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleEdit(draft)}
                    className="group cursor-pointer"
                  >
                    {draft.title && (
                      <h2 className="text-xl font-semibold text-gray-800 hover:text-primary transition-colors">
                        {draft.title}
                        <span className="ml-2 text-sm font-normal text-red-500 bg-red-100 px-2 py-0.5 rounded">
                          Draft
                        </span>
                      </h2>
                    )}
                    {!draft.title && (
                      <h2 className="text-xl font-semibold text-gray-800 hover:text-primary transition-colors">
                        <span className="text-sm font-normal text-red-500 bg-red-100 px-2 py-0.5 rounded">
                          Draft
                        </span>
                      </h2>
                    )}
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(draft)}
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors cursor-pointer"
                    >
                      <FiEdit2 size={16} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleSave(draft)}
                      disabled={saving}
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors cursor-pointer"
                    >
                      <FiSave size={16} />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => handleDelete(draft)}
                      className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <FiTrash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Last modified: {draft.date} | {draft.time}
                </div>
              </div>
              
              <div 
                onClick={() => handleEdit(draft)}
                className={`${draft.entry_type === 'image' ? 'bg-white p-8' : 'lined-paper p-8 bg-white'} cursor-pointer`}
              >
                <div className="mb-6 text-left">
                  <div className="text-xl font-handwriting font-medium text-gray-800 mb-1">
                    {draft.date}
                  </div>
                  <div className="text-xl font-handwriting text-gray-800 mb-1">
                    {draft.day}
                  </div>
                  <div className="text-xl font-handwriting text-gray-800">
                    {draft.time}
                  </div>
                </div>
                
                <div className="font-serif text-lg text-gray-800">
                  <div className="mt-10 font-handwriting text-xl">Dear Diary,</div>
                  {draft.entry_type === 'image' ? (
                    <div className="mt-6">
                      <img
                        src={draft.content}
                        alt="Diary entry"
                        className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                        onError={(e) => {
                          console.warn('Image loading error:', {
                            src: e.target.src
                          });
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDExMEwxMzAgMTQwSDEwMFYxODBIMTAwVjE0MEg3MFYxMTBIMTAwWiIgZmlsbD0iI0E1QjVCMiIvPjwvc3ZnPg==';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap line-height-loose font-handwriting text-xl mt-4">
                      {draft.content}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&display=swap');
        
        .font-handwriting {
          font-family: 'Caveat', 'Dancing Script', cursive;
        }
        
        .lined-paper {
          background-color: white;
          background-image: 
            linear-gradient(90deg, transparent 39px, #d6aed6 39px, #d6aed6 41px, transparent 41px),
            linear-gradient(#e5e7eb 1px, transparent 1px);
          background-size: 100% 2rem;
          line-height: 2rem;
          padding-left: 45px !important;
        }
        
        .line-height-loose {
          line-height: 2rem;
          padding-top: 0.5rem;
        }
      `}</style>
        </div>
      </EntryLockProtection>
  );
} 