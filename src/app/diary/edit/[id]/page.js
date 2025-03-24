"use client";

import { useState, useEffect } from "react";
import Navbar from "../../../components/Navbar";
import { useRouter, useParams } from "next/navigation";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import Footer from "../../../components/Footer";
import { useAuth } from "../../../../context/AuthContext";
import databaseUtils from "../../../../lib/database";

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
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
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
              // Remove table structure check that's causing errors
              
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
                
                // In Supabase it's has_manual_title (snake_case)
                setHasManualTitle(foundEntry.has_manual_title || false);
                setIsCloudEntry(true);
                
                // Add missing day field if needed
                if (!foundEntry.day && foundEntry.date) {
                  try {
                    // Parse date like "23rd March 2025"
                    const dateParts = foundEntry.date.split(' ');
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
                        }
                      }
                    }
                  } catch (e) {
                    console.error("Error reconstructing day:", e);
                  }
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
  
  // Handle save
  const handleSave = async () => {
    if (!content.trim()) {
      alert("Please write something before saving");
      return;
    }
    
    try {
      // If it's a cloud entry and user is logged in
      if (isCloudEntry && user && entryId) {
        console.log("Saving cloud entry:", { entryId, isCloudEntry });
        console.log("User:", user.id);
        
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
          title: title || "", // Ensure not null
          content: content || "", // Ensure not null
          date: originalDate || "",
          day: originalDay || "",
          time: originalTime || "",
          hasManualTitle: hasManualTitle || false
        };
        
        console.log("Updates to send:", updates);
        
        try {
          const result = await databaseUtils.updateDiaryEntry(entryId, updates, user.id);
          console.log("Update result:", result);
          
          if (result) {
            router.push(`/diary/${entryId}`);
          } else {
            console.error("Update failed - null result returned");
            alert("Failed to save changes. Please try again or check your connection.");
          }
        } catch (updateError) {
          console.error("Exception during update:", updateError);
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
          timestamp: originalTimestamp || new Date().getTime()
        };
        
        // Save to localStorage
        localStorage.setItem("diaryEntries", JSON.stringify(existingEntries));
        
        // Redirect back to the diary entry view
        router.push(`/diary/${entryIndex}`);
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Could not save entry. Please try again.");
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <main className="max-w-4xl mx-auto pt-24 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-150"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-300"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <Link href={isCloudEntry ? `/diary/${entryId}` : `/diary/${params.id}`} className="flex items-center gap-2 text-primary hover:underline">
            <FiArrowLeft size={16} />
            <span>Back to Entry</span>
          </Link>
          
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            <FiSave size={16} />
            <span>Save Changes</span>
          </button>
        </div>
        
        {/* Lined paper style for diary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-4 border-b border-gray-200">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry Title (optional)"
              className="w-full bg-transparent border-none text-xl font-serif text-gray-800 focus:outline-none"
            />
          </div>
          
          <div className="lined-paper p-8 min-h-[70vh] bg-white">
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
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[calc(70vh-180px)] bg-transparent border-none outline-none resize-none font-handwriting text-xl text-gray-800 line-height-loose"
                placeholder="Write your thoughts here..."
              />
            </div>
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
        
        textarea {
          display: block;
          padding: 0;
          margin: 0;
          overflow-y: hidden;
        }
      `}</style>
      
      <Footer />
    </div>
  );
} 