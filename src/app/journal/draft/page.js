"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import EntryLockProtection from "@/components/EntryLockProtection";
import databaseUtils from "@/lib/database";
import Loading from "@/components/common/Loading";
import { NoDraftsFound } from "@/components/common/EntryNotFound";
import { BackButton, EditSaveDeleteButton } from "@/components/common/LinkButtons";

export default function JournalDraftPage() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    if (user && authChecked) {
      loadDrafts();
    }
  }, [user, authChecked]);

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

  // ------- Loading -------
  if (!authChecked || loading) {
    return (
      <Loading/>
    );
  }

  // ------- No Draft Found -------
  if (drafts.length === 0) {
    <NoDraftsFound EntryType={"journal"}/>
  }

  {/* ------------------------------ Main JSX -------------------------- */}

  return (
    <EntryLockProtection entryType="journal">
      {/*  ------- Main Page -------  */}
      <div className="min-h-screen text-text-primary bg-background">
        <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          
        {/* -- Back Button -- */}
        <BackButton
            href = "/journal"
          />

          {/* -- Page Title - Right -- */}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">My Drafts</h1>

            {/* -- Draft Count Banner -- */}
            <span className="text-sm text-text-inverse bg-text-primary/50 px-3 py-1 rounded-full">
              {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
            </span>
          </div>
        </div>

        {/* Draft Warning Message */}
        <div className="mb-4 text-xs text-warning/90 flex items-center gap-1.5">
          <svg className="w-3 h-3 text-warning/90" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Drafts are stored locally and won&apos;t sync across devices</span>
        </div>

        <div className="grid grid-cols-1 gap-5">

          {/* ------- Journal Preview Container ------- */}
          {drafts.map((draft, index) => (
            <div
              key={index}
              className="bg-bg-primary rounded-xl shadow-sm border border-border-primary overflow-hidden"
            >
              {/* ------- Journal Preview - Header ------- */}
              <div className="bg-bg-secondary border-b border-border-primary p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">

                    <h2 className="text-xl font-semibold hover:text-primary">
                  {/* -- Entry Draft Banner --*/}
                    <span className="mr-2 text-sm font-normal text-red-500/90 bg-red-100/90 px-2 py-0.5 rounded">
                      
                      {/* -- Title --*/}
                      {draft.title && (
                        <span>{draft.title}</span>
                      )}
                        Draft
                      </span>
                    </h2>
                  </div>

                  {/* -- Edit, Save and Delete Button -- */}

                  <EditSaveDeleteButton
                    onEdit={() => handleEdit(draft)}
                    onSave={() => handleSave(draft)}
                    onDelete={() => handleDelete(draft)}
                    saving = {saving}
                  />
                </div>

                <div className="text-sm text-text-secondary mt-1">
                  Last modified: {new Date(draft.timestamp).toLocaleString()}
                </div>
              </div>
              
              <div className="p-4">
                <div
                  onClick={() => handleEdit(draft)}
                  className="cursor-pointer"
                >

                  {/* ------- Journal Preview Container - Body ------- */}
                  <div className="prose prose-gray max-w-none max-h-64 overflow-y-auto">
                    <div 
                        className="
                              [display:-webkit-box]
                              [-webkit-box-orient:vertical]
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
                              dangerouslySetInnerHTML={{ __html: draft.content }}
                            />
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
        </main>
      </div>
    </EntryLockProtection>
  );
} 