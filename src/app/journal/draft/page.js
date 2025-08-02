"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Link from "next/link";
import { FiArrowLeft, FiEdit2, FiSave, FiTrash2 } from "react-icons/fi";
import databaseUtils from "../../../lib/database";

export default function JournalDraftPage() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    loadDrafts();
  }, [user, router]);

  const loadDrafts = () => {
    const storedDrafts = JSON.parse(localStorage.getItem(`journal_drafts_${user?.id}`) || '[]');
    setDrafts(storedDrafts);
    setLoading(false);
  };

  const handleEdit = (draft) => {
    // Navigate to new page for editing with editDraft parameter
    router.push(`/journal/new?editDraft=${draft.timestamp}`);
  };

  const handleSave = async (draft) => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      // Create a new entry in the database
      const newEntry = {
        title: draft.title || "Untitled",
        content: draft.content,
        date: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      };

      const result = await databaseUtils.createJournalEntry(user.id, newEntry);
      
      if (result) {
        // Remove this draft from localStorage
        const updatedDrafts = drafts.filter(d => 
          d.timestamp !== draft.timestamp
        );
        localStorage.setItem(`journal_drafts_${user.id}`, JSON.stringify(updatedDrafts));
        setDrafts(updatedDrafts);
        
        if (updatedDrafts.length === 0) {
          // If no more drafts, go back to journal
          router.push("/journal");
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
      localStorage.setItem(`journal_drafts_${user.id}`, JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);
      
      if (updatedDrafts.length === 0) {
        router.push("/journal");
      }
    } catch (error) {
      console.error("Error deleting draft:", error);
      alert("Could not delete draft. Please try again.");
    }
  };

  if (loading) {
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
            <Link href="/journal" className="text-primary hover:underline">
              Return to Journal
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <Link href="/journal" className="flex items-center gap-2 text-primary hover:underline">
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

        <div className="grid grid-cols-1 gap-5">
          {drafts.map((draft, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-white">
                      {draft.title && (
                        <span>{draft.title}</span>
                      )}
                      <span className="ml-2 text-sm font-normal text-red-500 bg-red-100 px-2 py-0.5 rounded">
                        Draft
                      </span>
                    </h2>
                  </div>
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
                <div className="text-sm text-gray-400 mt-1">
                  Last modified: {new Date(draft.timestamp).toLocaleString()}
                </div>
              </div>
              
              <div className="p-4">
                <div
                  onClick={() => handleEdit(draft)}
                  className="cursor-pointer"
                >
                  <div className="prose prose-gray max-w-none text-gray-800">
                    <div className="line-clamp-5 [&_img]:max-w-[200px] [&_img]:max-h-[150px] [&_img]:object-cover [&_img]:my-2">
                      {draft.content ? (
                        <div dangerouslySetInnerHTML={{ 
                          __html: draft.content.length > 300 
                            ? draft.content.substring(0, 300) + "..." 
                            : draft.content 
                        }} />
                      ) : (
                        <em>No content</em>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
} 