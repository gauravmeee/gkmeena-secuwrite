"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { FiSave, FiArrowLeft, FiUpload, FiX } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "../../../../context/AuthContext";
import databaseUtils from "../../../../lib/database";
import { supabase } from "../../../../lib/supabase";

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
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  useEffect(() => {
    // If it's an image entry from URL parameter, update the type
    const typeFromUrl = searchParams.get('type');
    if (typeFromUrl === 'image') {
      setEntryType('image');
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadEntry() {
      setLoading(true);
      try {
        if (user) {
          // Try to load from Supabase first
          try {
            // Check if this is a UUID (Supabase ID)
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
            
            if (isUuid) {
              // Fetch all entries and find the one with matching ID
              const entries = await databaseUtils.getDiaryEntries(user.id);
              console.log("All Supabase entries:", entries);
              const foundEntry = entries.find(e => e.id === params.id);
              
              if (foundEntry) {
                console.log("Found Supabase entry:", foundEntry);
                
                // Extract fields using Supabase column names
                setTitle(foundEntry.title || "");
                setContent(foundEntry.content || "");
                setOriginalDate(foundEntry.date || "");
                setOriginalDay(foundEntry.day || "");
                setOriginalTime(foundEntry.time || "");
                setEntryId(foundEntry.id);
                setHasManualTitle(foundEntry.has_manual_title || false);
                setIsCloudEntry(true);
                
                // Handle image entry
                if (foundEntry.image_url) {
                  console.log("Found image URL:", foundEntry.image_url);
                  const imageUrl = foundEntry.image_url;
                  
                  // If the image URL is a base64 string, use it directly
                  if (imageUrl.startsWith('data:image/')) {
                    setImagePreview(imageUrl);
                  } 
                  // If it's a Supabase storage URL, construct the full URL
                  else if (imageUrl.startsWith('diary-images/')) {
                    const { data: { publicUrl } } = supabase
                      .storage
                      .from('diary-images')
                      .getPublicUrl(imageUrl);
                    setImagePreview(publicUrl);
                  }
                  setEntryType('image');
                } else {
                  setEntryType('text');
                }
                
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
          try {
            // Get all entries
            const entries = JSON.parse(localStorage.getItem("diaryEntries") || "[]");
            
            // Find the entry with the matching id
            const entryIndex = parseInt(params.id);
            if (entryIndex >= 0 && entryIndex < entries.length) {
              const entry = entries[entryIndex];
              setTitle(entry.title || "");
              setContent(entry.content || "");
              setOriginalDate(entry.date || "");
              setOriginalDay(entry.day || "");
              setOriginalTime(entry.time || "");
              setOriginalTimestamp(entry.timestamp);
              setHasManualTitle(entry.hasManualTitle || false);
              setIsCloudEntry(false);
              
              // Handle image entry in localStorage
              if (entry.imageUrl) {
                console.log("Found localStorage image:", entry.imageUrl);
                setImagePreview(entry.imageUrl);
                setEntryType('image');
              } else {
                setEntryType('text');
              }
              
              // Add missing day field if needed
              if (!entry.day && entry.date) {
                try {
                  // Parse date like "23rd March 2025"
                  const dateParts = entry.date.split(' ');
                  if (dateParts.length >= 3) {
                    const day = parseInt(dateParts[0]);
                    const month = dateParts[1];
                    const year = parseInt(dateParts[2]);
                    
                    if (!isNaN(day) && !isNaN(year)) {
                      const monthMap = {
                        'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
                        'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
                      };
                      
                      if (month in monthMap) {
                        const date = new Date(year, monthMap[month], day);
                        const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
                        setOriginalDay(weekday);
                        
                        // Also update the entry in localStorage to include day
                        entries[entryIndex].day = weekday;
                        localStorage.setItem("diaryEntries", JSON.stringify(entries));
                      }
                    }
                  }
                } catch (e) {
                  console.error("Error reconstructing day:", e);
                }
              }
            }
          } catch (error) {
            console.error("Error loading from localStorage:", error);
          }
        }
      } catch (error) {
        console.error("Error loading entry:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadEntry();
  }, [params.id, user]);
  
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
    setEntryType('text');
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
          title: title || "",
          content: content || "",
          date: originalDate || "",
          time: originalTime || "",
          hasManualTitle: hasManualTitle || false,
          imageFile: imageFile || null,
          imageUrl: imagePreview || null
        };
        
        console.log("Preparing update with data:", updates);
        
        try {
          const result = await databaseUtils.updateDiaryEntry(entryId, updates, user.id);
          
          if (result) {
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
          title: title,
          hasManualTitle: hasManualTitle || (title !== existingEntries[entryIndex].title),
          content: content,
          date: originalDate,
          day: originalDay,
          time: originalTime,
          timestamp: originalTimestamp || new Date().getTime(),
          entryType: entryType,
          imageUrl: imagePreview || null
        };
        
        // Save to localStorage
        localStorage.setItem("diaryEntries", JSON.stringify(existingEntries));
        
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
  
  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/diary/${params.id}`} className="flex items-center gap-2 text-primary hover:underline">
            <FiArrowLeft size={16} />
            <span>Back to Entry</span>
          </Link>
          
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className={`flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg transition-all duration-300 ${
              saving || loading
                ? "bg-opacity-70 cursor-not-allowed"
                : "hover:bg-primary/90"
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
                <span className="hidden sm:inline">Saving...</span>
              </div>
            ) : (
              <>
                <FiSave size={18} />
                <span className="hidden sm:inline">Save Changes</span>
              </>
            )}
          </button>
        </div>
        
        <div className={`bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden ${entryType === 'image' ? 'pb-6' : ''}`}>
          <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-4 border-b border-gray-200">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry Title (optional)"
              className="w-full bg-transparent border-none text-xl font-serif text-gray-800 focus:outline-none"
            />
          </div>
          
          <div className={entryType === 'image' ? 'bg-white p-8' : 'lined-paper p-8 min-h-[70vh] bg-white'}>
            <div className="mb-6 text-left">
              <div className="text-xl font-handwriting font-medium text-gray-800 mb-1">
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
              <div className="text-xl font-handwriting text-gray-800 mb-1">
                {originalDay || new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </div>
              <div className="text-xl font-handwriting text-gray-800">
                {originalTime || new Date().toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                })}
              </div>
            </div>

            <div className="font-serif text-lg text-gray-800">
              <div className="mt-10 font-handwriting text-xl">Dear Diary,</div>
              
              {entryType === 'text' && (
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-[calc(70vh-180px)] bg-transparent border-none outline-none resize-none font-handwriting text-xl text-gray-800 line-height-loose"
                  placeholder="Write your thoughts here..."
                />
              )}
            </div>

            {entryType === 'image' && (
              <div className="mt-6 flex flex-col items-center justify-center border-t border-gray-200 pt-6">
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
                        <p className="text-gray-600 font-medium">Click to upload an image</p>
                        <p className="text-gray-500 text-sm mt-1">or drag and drop</p>
                        <p className="text-gray-400 text-xs mt-2">Maximum file size: 5MB</p>
                      </div>
                    </label>
                  </>
                ) : (
                  <div className="relative w-full">
                    <img
                      src={imagePreview}
                      alt="Diary entry"
                      className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
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
  );
} 