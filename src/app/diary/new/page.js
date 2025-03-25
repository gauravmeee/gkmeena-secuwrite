"use client";

import { useState, useEffect, Suspense } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { FiSave, FiArrowLeft, FiUpload, FiX } from "react-icons/fi";
import Link from "next/link";
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
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  // Add authentication check
  useEffect(() => {
    if (!user) {
      router.push('/');
    }

    // If it's an image entry from URL parameter, show file picker immediately
    const typeFromUrl = searchParams.get('type');
    if (typeFromUrl === 'image') {
      setEntryType('image');
      const input = document.getElementById('image-upload');
      if (input) {
        input.click();
      }
    }
  }, [user, router, searchParams]);

  // If not logged in, show loading state
  if (!user) {
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
          router.push("/diary");
          return;
        }
        
        // Fall back to our utility function
        console.log("Direct insert failed, trying utility function");
        const result = await databaseUtils.createDiaryEntry(user.id, newEntry);
        
        if (result) {
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
  
  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <Link href="/diary" className="flex items-center gap-2 text-primary hover:underline">
            <FiArrowLeft size={16} />
            <span>Back to Diary</span>
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
              <div className="text-xl font-handwriting font-medium text-gray-800 mb-1">{formattedDate}</div>
              <div className="text-xl font-handwriting text-gray-800 mb-1">{weekday}</div>
              <div className="text-xl font-handwriting text-gray-800">{formattedTime}</div>
            </div>
            
            <div className="font-serif text-lg text-gray-800">
              <div className="mt-10 font-handwriting text-xl">Dear Diary,</div>
              
              {entryType === 'text' && (
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-[calc(70vh-180px)] bg-transparent border-none outline-none resize-none font-handwriting text-xl text-gray-800 line-height-loose"
                  placeholder="Write your thoughts here..."
                  autoFocus
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

// Main component with Suspense boundary
export default function NewDiaryEntry() {
  return (
    <Suspense fallback={
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
    }>
      <NewDiaryEntryContent />
    </Suspense>
  );
} 