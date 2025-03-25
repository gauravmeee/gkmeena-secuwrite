"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import databaseUtils from "../../../lib/database";
import supabase from "../../../lib/supabase";

export default function NewDiaryEntry() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  
  // Add authentication check
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

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
  
  // Handle save with Supabase or localStorage
  const handleSave = async () => {
    if (!content.trim()) {
      alert("Please write something before saving");
      return;
    }

    if (!user) {
      alert("Please log in to save your diary entry");
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
          content: content || ""
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
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <FiSave size={16} />
            <span className="hidden sm:inline">{loading ? "Saving..." : "Save Entry"}</span>
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
              <div className="text-xl font-handwriting font-medium text-gray-800 mb-1">{formattedDate}</div>
              <div className="text-xl font-handwriting text-gray-800 mb-1">{weekday}</div>
              <div className="text-xl font-handwriting text-gray-800">{formattedTime}</div>
            </div>
            
            <div className="font-serif text-lg text-gray-800">
              <div className="mt-10 font-handwriting text-xl">Dear Diary,</div>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[calc(70vh-180px)] bg-transparent border-none outline-none resize-none font-handwriting text-xl text-gray-800 line-height-loose"
                placeholder="Write your thoughts here..."
                autoFocus
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
      
    </div>
  );
} 