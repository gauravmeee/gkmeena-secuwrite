"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { FiArrowLeft, FiEdit2, FiTrash2 } from "react-icons/fi";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import Footer from "../../components/Footer";
import { useAuth } from "../../../context/AuthContext";
import databaseUtils from "../../../lib/database";

export default function DiaryEntryPage() {
  const params = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
              // Fetch all entries and find the one with matching ID
              const entries = await databaseUtils.getDiaryEntries(user.id);
              const foundEntry = entries.find(e => e.id === params.id);
              
              if (foundEntry) {
                // Add missing day field if needed
                if (!foundEntry.day && foundEntry.date) {
                  // Try to reconstruct the day from the date
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
                          foundEntry.day = date.toLocaleDateString('en-US', { weekday: 'long' });
                        }
                      }
                    }
                  } catch (e) {
                    console.error("Error reconstructing day:", e);
                  }
                }
                setEntry(foundEntry);
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
            // Add missing day field if needed
            if (!entries[entryIndex].day && entries[entryIndex].date) {
              // Same logic as above to reconstruct the day
              try {
                const dateParts = entries[entryIndex].date.split(' ');
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
                      entries[entryIndex].day = date.toLocaleDateString('en-US', { weekday: 'long' });
                    }
                  }
                }
              } catch (e) {
                console.error("Error reconstructing day:", e);
              }
            }
            setEntry(entries[entryIndex]);
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

  const handleDelete = async () => {
    try {
      if (user && entry?.id) {
        // Check if this is a UUID (Supabase ID)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.id);
        
        if (isUuid) {
          // Delete from Supabase
          await databaseUtils.deleteDiaryEntry(entry.id, user.id);
          router.push("/diary");
          return;
        }
      }
      
      // Fall back to localStorage
      const entries = JSON.parse(localStorage.getItem("diaryEntries") || "[]");
      
      // Remove the entry with the matching id
      const entryIndex = parseInt(params.id);
      if (entryIndex >= 0 && entryIndex < entries.length) {
        entries.splice(entryIndex, 1);
        localStorage.setItem("diaryEntries", JSON.stringify(entries));
        router.push("/diary");
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Could not delete entry. Please try again.");
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

  if (!entry) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <main className="max-w-4xl mx-auto pt-24 px-4">
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <p className="text-xl">Entry not found</p>
            <Link href="/diary" className="text-primary hover:underline">
              Return to Diary
            </Link>
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
          <Link href="/diary" className="flex items-center gap-2 text-primary hover:underline">
            <FiArrowLeft size={16} />
            <span>Back to Diary</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link
              href={`/diary/edit/${entry.id || params.id}`}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <FiEdit2 size={16} />
              <span>Edit</span>
            </Link>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
            >
              <FiTrash2 size={16} />
              <span>Delete</span>
            </button>
          </div>
        </div>
        
        {/* Lined paper style for diary display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-4 border-b border-gray-200">
            <h1 className="text-xl font-serif text-gray-800">{entry.title}</h1>
          </div>
          
          <div className="lined-paper p-8 min-h-[70vh] bg-white">
            <div className="mb-6 text-left">
            <div className="text-xl font-handwriting font-medium text-gray-800 mb-1">
  {entry.date || (() => {
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
  {entry.day || new Date().toLocaleDateString('en-US', { weekday: 'long' })}
</div>
<div className="text-xl font-handwriting text-gray-800">
  {entry.time || new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  })}
</div>
            </div>
            
            <div className="font-serif text-lg text-gray-800">
              <div className="mt-10 font-handwriting text-xl">Dear Diary,</div>
              <div className="whitespace-pre-wrap line-height-loose font-handwriting text-xl">{entry.content}</div>
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
        }
      `}</style>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemType="diary entry"
      />
      
      <Footer />
    </div>
  );
} 