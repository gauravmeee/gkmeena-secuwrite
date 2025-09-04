"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";

import Loading from "@/components/common/Loading";
import { BackButton, ToggleImageButton } from "@/components/common/LinkButtons";
import { SaveEntryButton } from "@/components/common/ActionButtons";
import { useRouter, useSearchParams } from "next/navigation";
import {FiUpload, FiX} from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import databaseUtils from "../../../lib/database";
import supabase from "../../../lib/supabase";

// Create a new component to use searchParams
function NewDiaryEntryContent() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [entryType, setEntryType] = useState('text');
  const [authChecked, setAuthChecked] = useState(false);

  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  // Load draft content when component mounts and show file picker immediately
  useEffect(() => {
    if (user) {
      const editDraftId = searchParams.get('editDraft');
      const typeFromUrl = searchParams.get('type'); // Get type parameter first
      
      if (editDraftId) {
        // Editing a specific draft - clear any session flags first
        sessionStorage.removeItem(`diary_new_session_${user.id}`);
        
        const drafts = JSON.parse(localStorage.getItem(`diary_drafts_${user.id}`) || "[]");
        const currentDraft = drafts.find(d => d.timestamp === parseInt(editDraftId));
        
        if (currentDraft) {
          setTitle(currentDraft.title || "");
          setContent(currentDraft.content || "");
          // Priority: URL parameter > draft entry type > default 'text'
          setEntryType(typeFromUrl || currentDraft.entry_type || 'text');
          if (currentDraft.imagePreview && (typeFromUrl === 'image' || currentDraft.entry_type === 'image')) {
            setImagePreview(currentDraft.imagePreview);
          }
          
          // Mark this draft as currently being edited
          const updatedDrafts = drafts.map(d => ({
            ...d,
            isCurrentlyEditing: d.timestamp === currentDraft.timestamp
          }));
          localStorage.setItem(`diary_drafts_${user.id}`, JSON.stringify(updatedDrafts));
        }
      } else {
        // Check if user is intentionally creating new or refreshing while writing
        const isIntentionallyNew = sessionStorage.getItem(`diary_new_session_${user.id}`);
        
        if (isIntentionallyNew === 'true') {
          // User intentionally clicked "New Entry" - start blank
          // Clear any currently editing flags
          const drafts = JSON.parse(localStorage.getItem(`diary_drafts_${user.id}`) || "[]");
          const updatedDrafts = drafts.map(d => ({ ...d, isCurrentlyEditing: false }));
          localStorage.setItem(`diary_drafts_${user.id}`, JSON.stringify(updatedDrafts));
          
          // Reset form to blank state, but respect URL parameter
          setTitle("");
          setContent("");
          setEntryType(typeFromUrl || 'text'); // URL parameter takes priority
          setImagePreview(null);
          
          // Clear the session flag
          sessionStorage.removeItem(`diary_new_session_${user.id}`);
        } else {
          // Check if there's a draft that was being edited (for refresh scenarios)
          const drafts = JSON.parse(localStorage.getItem(`diary_drafts_${user.id}`) || "[]");
          const currentDraft = drafts.find(d => d.isCurrentlyEditing);
          
          if (currentDraft && !typeFromUrl) {
            // Load the currently editing draft only if no URL type parameter
            setTitle(currentDraft.title || "");
            setContent(currentDraft.content || "");
            setEntryType(currentDraft.entry_type || 'text');
            if (currentDraft.imagePreview && currentDraft.entry_type === 'image') {
              setImagePreview(currentDraft.imagePreview);
            }
          } else {
            // No draft being edited OR URL parameter overrides - start fresh
            setTitle("");
            setContent("");
            setEntryType(typeFromUrl || 'text'); // URL parameter takes priority
            setImagePreview(null);
            
            // If URL specifies image type, clear any text draft
            if (typeFromUrl === 'image') {
              const drafts = JSON.parse(localStorage.getItem(`diary_drafts_${user.id}`) || "[]");
              const updatedDrafts = drafts.map(d => ({ ...d, isCurrentlyEditing: false }));
              localStorage.setItem(`diary_drafts_${user.id}`, JSON.stringify(updatedDrafts));
            }
          }
        }
      }
  
      // If it's an image entry from URL parameter, show file picker after state is set
      if (typeFromUrl === 'image') {
        setTimeout(() => {
          const input = document.getElementById('image-upload');
          if (input) {
            input.click();
          }
        }, 100); // Small delay to ensure DOM is ready
      }
    }
  }, [user, searchParams]);

  // Save draft content when typing or when image changes (silent)
  useEffect(() => {
    if (user) {
      const saveTimer = setTimeout(() => {
        // Save draft if there's any content (title, text content, or image)
        if (title || content || imagePreview) {
          try {
            // Get existing drafts
            const drafts = JSON.parse(localStorage.getItem(`diary_drafts_${user.id}`) || "[]");
            
            // Find currently editing draft
            const currentDraft = drafts.find(d => d.isCurrentlyEditing);
            
            if (currentDraft) {
              // Update existing draft
              const updatedDrafts = drafts.map(d => {
                if (d.isCurrentlyEditing) {
                  return {
                    ...d,
                    title: title || "",
                    content: entryType === 'image' ? imagePreview : (content || ""),
                    entry_type: entryType,
                    imagePreview: entryType === 'image' ? imagePreview : null,
                    lastModified: new Date().getTime()
                  };
                }
                return { ...d, isCurrentlyEditing: false };
              });
              localStorage.setItem(`diary_drafts_${user.id}`, JSON.stringify(updatedDrafts));
            } else {
              // Create new draft
              const newDraft = {
                title: title || "",
                content: entryType === 'image' ? imagePreview : (content || ""),
                timestamp: new Date().getTime(),
                lastModified: new Date().getTime(),
                isDraft: true,
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
                }),
                user_id: user.id,
                entry_type: entryType,
                imagePreview: entryType === 'image' ? imagePreview : null
              };

              // Remove editing flag from all other drafts
              const otherDrafts = drafts.map(d => ({ ...d, isCurrentlyEditing: false }));
              localStorage.setItem(`diary_drafts_${user.id}`, JSON.stringify([newDraft, ...otherDrafts]));
            }
            
            // Silent saving - no status updates to avoid re-renders
            
          } catch (error) {
            console.error('Error saving draft:', error);
          }
        }
      }, 1000);

      return () => clearTimeout(saveTimer);
    }
  }, [title, content, imagePreview, user, entryType]);

  // Clear draft after successful save
  const clearDraft = () => {
    if (user) {
      const drafts = JSON.parse(localStorage.getItem(`diary_drafts_${user.id}`) || "[]");
      const updatedDrafts = drafts.filter(draft => !draft.isCurrentlyEditing);
      localStorage.setItem(`diary_drafts_${user.id}`, JSON.stringify(updatedDrafts));
    }
  };

  // Don't clear the currently editing flag when leaving the page
  // This ensures drafts persist across page refreshes and navigation
  // The flag will only be cleared when the draft is saved or deleted

  // Save draft immediately when page is about to unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user && (title || content || imagePreview)) {
        try {
          const drafts = JSON.parse(localStorage.getItem(`diary_drafts_${user.id}`) || "[]");
          const currentDraft = drafts.find(d => d.isCurrentlyEditing);
          
          if (currentDraft) {
            // Update existing draft
            const updatedDrafts = drafts.map(d => {
              if (d.isCurrentlyEditing) {
                return {
                  ...d,
                  title: title || "",
                  content: entryType === 'image' ? imagePreview : (content || ""),
                  entry_type: entryType,
                  imagePreview: entryType === 'image' ? imagePreview : null,
                  lastModified: new Date().getTime()
                };
              }
              return d;
            });
            localStorage.setItem(`diary_drafts_${user.id}`, JSON.stringify(updatedDrafts));
          } else {
            // Create new draft
            const newDraft = {
              title: title || "",
              content: entryType === 'image' ? imagePreview : (content || ""),
              timestamp: new Date().getTime(),
              lastModified: new Date().getTime(),
              isDraft: true,
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
              }),
              user_id: user.id,
              entry_type: entryType,
              imagePreview: entryType === 'image' ? imagePreview : null
            };

            const otherDrafts = drafts.map(d => ({ ...d, isCurrentlyEditing: false }));
            localStorage.setItem(`diary_drafts_${user.id}`, JSON.stringify([newDraft, ...otherDrafts]));
          }
        } catch (error) {
          console.error('Error saving draft on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [title, content, imagePreview, user, entryType]);

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

  // useEffect(() => {
  //   // If it's an image entry from URL parameter, show file picker immediately
  //   const typeFromUrl = searchParams.get('type');
  //   if (typeFromUrl === 'image') {
  //     setEntryType('image');
  //     const input = document.getElementById('image-upload');
  //     if (input) {
  //       input.click();
  //     }
  //   }
  // }, [searchParams]);

  // ---
  if (!authChecked || !user) {
    // ------- Loading -------
    return <Loading/>
  }
  
  // Get current date and time
  const now = new Date();
  
  // Function to add ordinal suffix to day number
  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  const day = now.getDate();
  const ordinalDay = day + getOrdinalSuffix(day);
  const month = now.toLocaleDateString('en-US', { month: 'long' });
  const year = now.getFullYear();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Format time with 12-hour clock (e.g., 9:30 PM)
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12; // Convert 0 to 12
  const formattedTime = `${formattedHours}:${minutes} ${ampm}`;
  
  // Format for display
  const formattedDate = `${ordinalDay} ${month} ${year}`;
  
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
  };

  const handleSave = async () => {
    if (entryType === 'text' && !content.trim()) {
      alert("Please write something before saving");
      return;
    }

    if (entryType === 'image' && !imageFile && !imagePreview) {
      alert("Please upload an image before saving");
      return;
    }

    try {
      setLoading(true);
      
      const newEntry = {
        title: title || "",
        hasManualTitle: !!title,
        date: formattedDate,
        time: formattedTime,
        day: weekday,
        content: content,
        imageFile: imageFile || null,
        imageUrl: imagePreview || null,
        timestamp: new Date().getTime()
      };
      
      console.log("Trying to save with user:", user.id);
      
      try {
        // First check if we can even query the table
        const { data: tableCheck, error: tableError } = await supabase
          .from('diary_entries')
          .select('id')
          .limit(1);
        
        console.log("Table check:", { data: tableCheck, error: tableError });
        
        // Try direct insert with minimal data
        const minimalEntry = {
          user_id: user.id,
          title: title || "",
          content: content || "",
          imageFile: imageFile || null,
          imageUrl: imagePreview || null
        };
        
        console.log("Trying direct insert with:", minimalEntry);
        
        const { data: directData, error: directError } = await supabase
          .from('diary_entries')
          .insert([minimalEntry])
          .select();
        
        console.log("Direct insert result:", { data: directData, error: directError });
        
        if (!directError && directData && directData.length > 0) {
          console.log("Direct insert worked! Redirecting...");
          clearDraft(); // Clear draft after successful save
          router.push("/diary");
          return;
        }
        
        // Fall back to our utility function
        console.log("Direct insert failed, trying utility function");
        const result = await databaseUtils.createDiaryEntry(user.id, newEntry);
        
        if (result) {
          clearDraft(); // Clear draft after successful save
          router.push("/diary");
        } else {
          throw new Error("Failed to save entry");
        }
      } catch (error) {
        console.error("Error saving to Supabase:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Could not save entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  {/* --------------------------- Main JSX ------------------------- */}
  return (
    //  ------- Main Page ------- 
    <div className="min-h-screen text-text-primary bg-background">
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          
          <div className="flex items-center gap-4">
            {/* -- Back Button -- */}
            <BackButton 
              href={searchParams.get('editDraft') ? "/diary/draft" : "/diary"} 
            />
          </div>
          
          <div className="flex items-center gap-4">

            {/* -- Image/Text Toggle Button -- */}
            {!searchParams.get('editDraft') && (
              <ToggleImageButton
                entryFormat = {entryType}
              />
            )}
            {/* -- Save Button -- */}
            <SaveEntryButton
              onClick={handleSave}
              loading={loading}
            />
          </div>
        </div>
        
        {/* ------- Diary Container -------  */}
        <div className="rounded-xl shadow-sm border border-border-primary overflow-hidden">
          
          
          {/* ------- Diary Container - Header ------- */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/30 p-4 border-b border-border-primary">

            {/* -- Title -- */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry Title (optional)"
              className="w-full bg-transparent border-none text-xl font-serif focus:outline-none"
            />
          </div>
          
          {/* ------- Diary Container - Body ------- */}
          <div className={`p-8 min-h-[70vh] ${entryType === 'image' ? 'image-paper' : 'lined-paper'}`}>
            
            <div className="mb-6 text-left">

              {/* ---- Diary Date Time --- */}
              <div className="text-xl font-medium mb-1">{formattedDate}</div>
              <div className="text-xl mb-1">{weekday}</div>
              <div className="text-xl">{formattedTime}</div>
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
                  autoFocus
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
                  <div className="relative w-full">

                    {/* -- Image Preview -- */}
                    <Image
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
      
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&family=Kalam&display=swap");`}</style>      
    </div>
  );
}

// Main component with Suspense boundary
export default function NewDiaryEntry() {
  return (
    <Suspense fallback={<Loading/>}>
      <NewDiaryEntryContent />
    </Suspense>
  );
} 