"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiSave, FiUpload, FiX} from "react-icons/fi";

import Loading from "@/components/common/Loading";
import { BackButton } from "@/components/common/LinkButtons";
import EntryLockProtection from "@/components/EntryLockProtection";
import { useAuth } from "@/context/AuthContext";
import databaseUtils from "@/lib/database";
import { SaveEntryButton } from "@/components/common/ActionButtons";

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
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  // Load draft content when component mounts
  useEffect(() => {
    if (user && params.id) {
      const draftKey = `diary_edit_draft_${user.id}_${params.id}`;
      const draftTitle = localStorage.getItem(`${draftKey}_title`);
      const draftContent = localStorage.getItem(`${draftKey}_content`);
      if (draftTitle) setTitle(draftTitle);
      if (draftContent) setContent(draftContent);
    }
  }, [user, params.id]);

  // Save draft content when typing
  useEffect(() => {
    if (user && params.id && entryType === 'text') {
      const draftKey = `diary_edit_draft_${user.id}_${params.id}`;
      const saveTimer = setTimeout(() => {
        if (title || content) {
          localStorage.setItem(`${draftKey}_title`, title);
          localStorage.setItem(`${draftKey}_content`, content);
        }
      }, 1000); // Save after 1 second of no typing

      return () => clearTimeout(saveTimer);
    }
  }, [title, content, user, params.id, entryType]);

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
      if (!user || !params.id) return;

      try {
        if (user) {
          // Try to load from Supabase first
          try {
            // Check if this is a UUID (Supabase ID)
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
            
            if (isUuid) {
              // Fetch all entries and find the one with matching ID
              const entries = await databaseUtils.getDiaryEntries(user.id);
              const foundEntry = entries.find(e => e.id === params.id);
              
              if (foundEntry) {
                // Set entry type and image preview if it's an image entry
                const entryType = foundEntry.entry_type || 'text';
                setEntryType(entryType);
                if (entryType === 'image') {
                  setImagePreview(foundEntry.content);
                  setContent('');
                } else {
                  setContent(foundEntry.content || '');
                }
                
                setTitle(foundEntry.title || "");
                setOriginalDate(foundEntry.date || "");
                setOriginalDay(foundEntry.day || "");
                setOriginalTime(foundEntry.time || "");
                setEntryId(foundEntry.id);
                setHasManualTitle(foundEntry.has_manual_title || false);
                setIsCloudEntry(true);
                setLoading(false);
                return;
              }
            }
          } catch (error) {
            console.error("Error loading from Supabase:", error);
          }
        }
        
        // Fall back to localStorage
        if (typeof window !== "undefined") {
          // Get all entries
          const entries = JSON.parse(localStorage.getItem("diaryEntries") || "[]");
          
          // Find the entry with the matching id
          const entryIndex = parseInt(params.id);
          if (entryIndex >= 0 && entryIndex < entries.length) {
            const entry = entries[entryIndex];
            setTitle(entry.title || "");
            setOriginalDate(entry.date || "");
            setOriginalDay(entry.day || "");
            setOriginalTime(entry.time || "");
            setOriginalTimestamp(entry.timestamp);
            setHasManualTitle(entry.hasManualTitle || false);
            setIsCloudEntry(false);
            
            // Handle image entry in localStorage
            if (entry.entry_type === 'image') {
              setImagePreview(entry.content);
              setContent('');
              setEntryType('image');
            } else {
              setContent(entry.content || '');
              setEntryType('text');
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
  }, [params.id, user, router, authChecked]);
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Image size should be less than 5MB");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert("Please upload an image file");
        return;
      }

      setImageFile(file);
      setEntryType('image');
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    // Keep the entry type as 'image' so the image upload interface remains visible
    // setEntryType('text'); // Removed this line
  };

  const handleSave = async () => {
    if (entryType === 'text' && !content.trim()) {
      alert("Please write something before saving");
      return;
    }

    // For image entries, allow saving even without an image (will convert to text entry)
    if (entryType === 'image' && !imageFile && !imagePreview) {
      // Allow saving without image - it will be converted to text entry
      // No alert, just continue with save
    }
    
    try {
      setSaving(true);
      // If it's a cloud entry and user is logged in
      if (isCloudEntry && user && entryId) {
        console.log("Starting save operation:", { 
          entryId, 
          isCloudEntry,
          userId: user.id,
          hasContent: !!content.trim(),
          hasTitle: !!title.trim(),
          hasImage: !!imageFile || !!imagePreview
        });
        
        if (!user.id) {
          console.error("User ID is missing");
          alert("You must be logged in to save this entry. Please sign in and try again.");
          return;
        }
        
        // Validate entryId format
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entryId)) {
          console.error("Invalid entry ID format:", entryId);
          alert("Invalid entry ID format. Please try again or create a new entry.");
          return;
        }
        
        // Update in Supabase
        const updates = {
          title: title || "", // Include title even if empty to allow clearing
          content: content || "",
          date: originalDate || "",
          time: originalTime || "",
          hasManualTitle: !!title // Set hasManualTitle based on whether title exists
        };

        // Handle image updates properly
        if (entryType === 'image') {
          if (imageFile) {
            // New image uploaded
            updates.imageFile = imageFile;
          } else if (imagePreview) {
            // Existing image or base64 data
            updates.imageUrl = imagePreview;
          } else {
            // No image selected, treat as text entry
            if (content && content.trim()) {
              updates.content = content;
            }
            // Set entry type to text since no image is present
            updates.entryType = 'text';
          }
        } else {
          // Text entry - only include content if it's not empty
          if (content && content.trim()) {
            updates.content = content;
          }
        }
        
        console.log("Preparing update with data:", updates);
        console.log("Title value:", title);
        console.log("Title type:", typeof title);
        console.log("Title length:", title ? title.length : 0);
        
        try {
          const result = await databaseUtils.updateDiaryEntry(entryId, updates, user.id);
          
          if (result) {
            clearDraft(); // Clear draft after successful save
            console.log("Update successful, redirecting to:", `/diary/${entryId}`);
            router.push(`/diary/${entryId}`);
          } else {
            console.error("Update failed - null result returned from databaseUtils.updateDiaryEntry");
            alert("Failed to save changes. Please try again or check your connection.");
          }
        } catch (updateError) {
          console.error("Exception during update:", {
            message: updateError.message,
            stack: updateError.stack
          });
          alert("An error occurred while updating. Please try again later.");
        }
        return;
      }
      
      // Otherwise fall back to localStorage
      const existingEntries = JSON.parse(localStorage.getItem("diaryEntries") || "[]");
      
      // Find the entry with the matching id
      const entryIndex = parseInt(params.id);
      if (entryIndex >= 0 && entryIndex < existingEntries.length) {
        // Update the entry
        existingEntries[entryIndex] = {
          title: title || null, // Allow null for empty titles
          hasManualTitle: !!title, // Set hasManualTitle based on whether title exists
          content: entryType === 'image' && imagePreview ? imagePreview : content,
          date: originalDate,
          day: originalDay,
          time: originalTime,
          timestamp: originalTimestamp || new Date().getTime(),
          entry_type: entryType === 'image' && imagePreview ? 'image' : 'text',
          imageUrl: imagePreview || null
        };
        
        // Save to localStorage
        localStorage.setItem("diaryEntries", JSON.stringify(existingEntries));
        clearDraft(); // Clear draft after successful save
        
        // Redirect back to the diary entry view
        router.push(`/diary/${entryIndex}`);
      }
    } catch (error) {
      console.error("Error in handleSave:", {
        message: error.message,
        stack: error.stack
      });
      alert("Could not save entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  
  if (!authChecked || !user) {
    return (
      <Loading/>
    );
  }
  
  return (
    <EntryLockProtection entryType="diary">

      {/* ------- Main Page ------- */}
      <div className="min-h-screen text-text-primary bg-background">
        <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">

          {/* -- Back Button -- */}
          <BackButton
            href = {`/diary/${entryId}`}
          />
            {(title || content) && entryType === 'text'}
          </div>
          
          {/* -- Save Button -- */}
          <SaveEntryButton
            onClick = {handleSave}
            loading = {saving}
          />
        </div>
        
        {/* ------- Diary Container ------- */}
        <div className="rounded-xl shadow-sm border border-border-primary overflow-hidden">
          
          {/* Diary Container - Header */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/30 p-4 border-b border-border-primary">
            {/* -- Title --*/}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry Title (optional)"
              className="w-full bg-transparent border-none text-xl font-serif focus:outline-none"
            />
          </div>
          
          {/* ------- Diaary Container - Body ------- */}
          <div className={`p-8 min-h-[70vh] ${entryType === 'image' ? 'image-paper' : 'lined-paper'}`}>
            
            <div className="mb-6 text-left">

              {/* ---- Diary Date Time --- */}
              <div className="text-xl font-medium mb-1">
                {originalDate || (() => {
                  const now = new Date();
                  const day = now.getDate();
                  
                  // Function to add ordinal suffix
                  const getOrdinalSuffix = (d) => {
                    if (d > 3 && d < 21) return 'th';
                    switch (d % 10) {
                      case 1: return 'st';
                      case 2: return 'nd';
                      case 3: return 'rd';
                      default: return 'th';
                    }
                  };
                  
                  return `${day}${getOrdinalSuffix(day)} ${now.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  }).split(' ')[0]} ${now.getFullYear()}`;
                })()}
              </div>
              <div className="text-xl mb-1">
                {originalDay || new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </div>
              <div className="text-xl">
                {originalTime || new Date().toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                })}
              </div>
            </div>

            {/* -- Dear Diary -- */}
            <div className="text-lg">
              <div className="mt-10 text-xl">Dear Diary,</div>
              
              {/* -- Text Entry -- */}
              {entryType === 'text' && (
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-[calc(70vh-180px)] bg-transparent border-none outline-none resize-none text-xl line-height-loose"
                  placeholder="Write your thoughts here..."
                />
              )}
            </div>
            
            {/* -- Image Entry -- */}
            {entryType === 'image' && (
              <div className="mt-6 flex flex-col items-center justify-center pt-6">
                {!imagePreview ? (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center gap-4 w-full p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
                    >
                      <FiUpload size={40} className="text-gray-400" />
                      <div className="text-center">
                      <p className="text-text-secondary font-medium">Click to upload an image</p>
                        <p className="text-text-secondary text-sm mt-1">or drag and drop</p>
                        <p className="text-text-muted text-xs mt-2">Maximum file size: 5MB</p>
                      </div>
                    </label>
                  </>
                ) : (
                  // -- Text Entry -- 
                  <div className="relative w-full">
                    <img
                      src={imagePreview}
                      alt="Diary entry"
                      className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                    />

                    
                    {/* -- Remove Image Button -- */}
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors border-2 border-transparent"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <style jsx global>{`@import url("https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&family=Kalam&display=swap");`}</style>
        </div>
      </EntryLockProtection>
  );
} 