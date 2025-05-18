"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiSave, FiArrowLeft, FiUpload, FiX, FiImage, FiFileText } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "../../../../context/AuthContext";
import databaseUtils from "../../../../lib/database";
import { supabase } from "../../../../lib/supabase";
import DiaryLock from "../../../components/DiaryLock";

export default function EditDiaryEntry() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [originalDate, setOriginalDate] = useState("");
  const [originalDay, setOriginalDay] = useState("");
  const [originalTime, setOriginalTime] = useState("");
  const [originalTimestamp, setOriginalTimestamp] = useState(null);
  const [hasManualTitle, setHasManualTitle] = useState(false);
  const [entryId, setEntryId] = useState(null);
  const [isCloudEntry, setIsCloudEntry] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [entryType, setEntryType] = useState('text');
  const [saving, setSaving] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  // Load draft content when component mounts
  useEffect(() => {
    if (user && params.id && !isLocked) {
      const draftKey = `diary_edit_draft_${user.id}_${params.id}`;
      const draftTitle = localStorage.getItem(`${draftKey}_title`);
      const draftContent = localStorage.getItem(`${draftKey}_content`);
      if (draftTitle) setTitle(draftTitle);
      if (draftContent) setContent(draftContent);
    }
  }, [user, params.id, isLocked]);

  // Save draft content when typing
  useEffect(() => {
    if (user && params.id && entryType === 'text' && !isLocked) {
      const draftKey = `diary_edit_draft_${user.id}_${params.id}`;
      const saveTimer = setTimeout(() => {
        if (title || content) {
          localStorage.setItem(`${draftKey}_title`, title);
          localStorage.setItem(`${draftKey}_content`, content);
        }
      }, 1000); // Save after 1 second of no typing

      return () => clearTimeout(saveTimer);
    }
  }, [title, content, user, params.id, entryType, isLocked]);

  // Clear draft after successful save
  const clearDraft = () => {
    if (user && params.id) {
      const draftKey = `diary_edit_draft_${user.id}_${params.id}`;
      localStorage.removeItem(`${draftKey}_title`);
      localStorage.removeItem(`${draftKey}_content`);
    }
  };
  
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
    async function loadEntry() {
      if (!user || !params.id || isLocked) return;

      try {
        // Try to load from Supabase first
        const entry = await databaseUtils.getDiaryEntry(params.id, user.id);
        
        if (entry) {
          setTitle(entry.title || "");
          setContent(entry.content || "");
          setOriginalDate(entry.date || "");
          setOriginalDay(entry.day || "");
          setOriginalTime(entry.time || "");
          setOriginalTimestamp(entry.timestamp);
          setHasManualTitle(entry.has_manual_title || false);
          setEntryId(entry.id);
          setIsCloudEntry(true);
          setEntryType(entry.entry_type || 'text');
          
          if (entry.entry_type === 'image') {
            setImagePreview(entry.content);
          }
        } else {
          // Fall back to localStorage
          const entries = JSON.parse(localStorage.getItem("diaryEntries") || "[]");
          const entryIndex = parseInt(params.id);
          
          if (entryIndex >= 0 && entryIndex < entries.length) {
            const entry = entries[entryIndex];
            setTitle(entry.title || "");
            setContent(entry.content || "");
            setOriginalDate(entry.date || "");
            setOriginalDay(entry.day || "");
            setOriginalTime(entry.time || "");
            setOriginalTimestamp(entry.timestamp);
            setHasManualTitle(entry.has_manual_title || false);
            setIsCloudEntry(false);
            setEntryType(entry.entry_type || 'text');
            
            if (entry.entry_type === 'image') {
              setImagePreview(entry.content);
            }
          }
        }
      } catch (error) {
        console.error("Error loading entry:", error);
      } finally {
        setLoading(false);
      }
    }

    if (authChecked && user) {
      loadEntry();
    }
  }, [params.id, user, authChecked, isLocked]);

  const handleSave = async () => {
    if (!user || isLocked) return;
    setSaving(true);

    try {
      const entryData = {
        title,
        content: entryType === 'image' ? imageFile : content,
        date: originalDate,
        time: originalTime,
        has_manual_title: hasManualTitle,
        entry_type: entryType
      };

      if (isCloudEntry) {
        await databaseUtils.updateDiaryEntry(entryId, entryData, user.id);
      } else {
        // Update in localStorage
        const entries = JSON.parse(localStorage.getItem("diaryEntries") || "[]");
        const entryIndex = parseInt(params.id);
        
        if (entryIndex >= 0 && entryIndex < entries.length) {
          entries[entryIndex] = {
            ...entries[entryIndex],
            ...entryData,
            updated_at: new Date().toISOString()
          };
          localStorage.setItem("diaryEntries", JSON.stringify(entries));
        }
      }

      clearDraft();
      router.push('/diary');
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!authChecked || !user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <main className="max-w-4xl mx-auto pt-24 px-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (isLocked) {
    return <DiaryLock onUnlock={() => setIsLocked(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <main className="max-w-4xl mx-auto pt-24 px-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-4xl mx-auto pt-24 px-4">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/diary"
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <FiArrowLeft size={20} />
            <span>Back to Diary</span>
          </Link>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave size={18} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        <div className="space-y-6">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasManualTitle(true);
            }}
            placeholder="Entry Title"
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xl"
          />

          {entryType === 'image' ? (
            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Entry"
                    className="w-full rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      setEntryType('text');
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <button
                    onClick={() => document.getElementById('image-upload').click()}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                  >
                    <FiUpload size={18} />
                    <span>Upload Image</span>
                  </button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your entry here..."
              className="w-full h-96 bg-gray-800 text-white border border-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setEntryType('text')}
              className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                entryType === 'text'
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <FiFileText size={18} />
              <span>Text</span>
            </button>

            <button
              onClick={() => {
                setEntryType('image');
                document.getElementById('image-upload').click();
              }}
              className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                entryType === 'image'
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <FiImage size={18} />
              <span>Image</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 