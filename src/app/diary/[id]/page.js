"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Loading from "@/components/common/Loading";
import { BackButton, EditDeleteButton } from "@/components/common/LinkButtons";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import EntryLockProtection from "@/components/EntryLockProtection";
import { useAuth } from "@/context/AuthContext";
import databaseUtils from "@/lib/database";
import { supabase } from "@/lib/supabase";
import { EntryNotFound } from "@/components/common/EntryNotFound";


export default function DiaryEntryPage() {
  const params = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState(null);
  const [entryType, setEntryType] = useState('text');

  // Function to get signed URL for an image
  const getSignedUrl = async (imageUrl) => {
    if (!imageUrl || imageUrl.startsWith('data:image/')) {
      return imageUrl;
    }

    try {
      // Extract the path from the full URL if it's a full Supabase URL
      let path = imageUrl;
      if (imageUrl.includes('diary-images/')) {
        path = imageUrl.split('diary-images/')[1];
      }

      console.log('Attempting to get signed URL for path:', path);

      const { data, error } = await supabase
        .storage
        .from('diary-images')
        .createSignedUrl(path, 3600);

      if (error) {
        console.error('Error getting signed URL:', error);
        // If the error is "Object not found", try using the full URL
        if (error.message.includes('Object not found')) {
          console.log('Object not found, trying with full URL');
          return imageUrl;
        }
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDExMEwxMzAgMTQwSDEwMFYxODBIMTAwVjE0MEg3MFYxMTBIMTAwWiIgZmlsbD0iI0E1QjVCMiIvPjwvc3ZnPg==';
      }

      if (!data?.signedUrl) {
        console.error('No signed URL returned from Supabase');
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDExMEwxMzAgMTQwSDEwMFYxODBIMTAwVjE0MEg3MFYxMTBIMTAwWiIgZmlsbD0iI0E1QjVCMiIvPjwvc3ZnPg==';
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDExMEwxMzAgMTQwSDEwMFYxODBIMTAwVjE0MEg3MFYxMTBIMTAwWiIgZmlsbD0iI0E1QjVCMiIvPjwvc3ZnPg==';
    }
  };

  // Load signed URL when entry changes
  useEffect(() => {
    async function loadSignedUrl() {
      if (entry?.image_url) {
        const signedUrl = await getSignedUrl(entry.image_url);
        setImageUrl(signedUrl);
      }
    }

    loadSignedUrl();
  }, [entry]);

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
                // Set entry type based on content
                setEntryType(foundEntry.entry_type || 'text');
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
            setEntryType(entries[entryIndex].entry_type || 'text');
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

  useEffect(() => {
    // Update entryType when entry changes
    if (entry) {
      setEntryType(entry.entry_type || 'text');
    }
  }, [entry]);

  const handleDelete = async () => {
    try {
      if (user && entry?.id) {
        // Check if this is a UUID (Supabase ID)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.id);
        
        if (isUuid) {
          // Delete image from Supabase storage if it exists
          if (entry.image_url && !entry.image_url.startsWith('data:image/')) {
            try {
              // Extract the path from the full URL if it's a full Supabase URL
              let path = entry.image_url;
              if (entry.image_url.includes('diary-images/')) {
                path = entry.image_url.split('diary-images/')[1];
              } else if (entry.image_url.includes('storage.googleapis.com')) {
                // Extract path from full Supabase URL
                const urlParts = entry.image_url.split('/');
                path = urlParts.slice(urlParts.indexOf('diary-images') + 1).join('/');
              }

              console.log('Attempting to delete image from storage:', path);
              
              // First check if the file exists
              const { data: exists } = await supabase
                .storage
                .from('diary-images')
                .list(path.split('/').slice(0, -1).join('/'));

              if (exists) {
                const { error: storageError } = await supabase
                  .storage
                  .from('diary-images')
                  .remove([path]);

                if (storageError) {
                  console.error('Error deleting image from storage:', storageError);
                  // Try alternative path format
                  const altPath = path.replace(/^[^/]+\//, '');
                  console.log('Trying alternative path:', altPath);
                  const { error: altError } = await supabase
                    .storage
                    .from('diary-images')
                    .remove([altPath]);

                  if (altError) {
                    console.error('Error deleting image with alternative path:', altError);
                  }
                }
              } else {
                console.log('Image file not found in storage:', path);
              }
            } catch (error) {
              console.error('Error deleting image from storage:', error);
              // Continue with entry deletion even if image deletion fails
            }
          }

          // Delete entry from Supabase
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

{/* --------------------------- Main JSX ------------------------- */}

  return (
    <EntryLockProtection entryType="diary">
      {/* ------- Loading ------- */}
      {loading ? (
        
        <Loading/>

        // ------- Entry Not Found ------- 
      ) : !entry ? (

        <EntryNotFound EntryType={"journal"}/>
      ) : (

        //  ------- Main Page -------
        <div className="min-h-screen text-text-primary bg-background">
          
          <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
          <div className="flex items-center justify-between mb-6">

        {/* -- Back Button -- */}
          <BackButton
            href = "/diary"
          />

        {/* -- Edit & Delete Button -- */}
          <EditDeleteButton
            editLink={`/diary/edit/${entry.id || params.id}`}
            onDelete={() => setIsDeleteModalOpen(true)}
          />
          </div>
          
          
          {/* ------- Diary Container ------- */}
          <div className="rounded-xl shadow-sm border border-gray-300 overflow-hidden">
            
            {/* Diary Container - Header */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/30 p-4 border-b border-gray-200">
              {/* -- Title --*/}
              {entry.title && (
                <h1 className="text-xl font-semibold">
                  {entry.title}
                </h1>
              )}
            </div>
            
            {/* ------- Diaary Container - Body ------- */}
            <div className={entryType === 'image' ? 'image-paper  p-8 min-h-[70vh]' : 'lined-paper p-8 min-h-[70vh]'}>
              <div className="mb-6 text-left">

                {/* ---- Diary Date Time --- */}
                <div className="text-xl font-medium mb-1">
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

                <div className="text-xl  mb-1">
                  {entry.day || new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                </div>
                <div className="text-xl ">
                  {entry.time || new Date().toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                  })}
                </div>
              </div>

              <div className="text-lg">
                <div className="mt-10  text-xl">Dear Diary,</div>
                
                {entryType === 'image' ? (
                  // -- Text Entry -- 
                  <div className="mt-6">
                    <img
                      src={entry.content}
                      alt="Diary entry"
                      className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                      onError={(e) => {
                        console.warn('Image loading error:', {
                          src: e.target.src
                        });
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDExMEwxMzAgMTQwSDEwMFYxODBIMTAwVjE0MEg3MFYxMTBIMTAwWiIgZmlsbD0iI0E1QjVCMiIvPjwvc3ZnPg==';
                      }}
                    />
                  </div>
                ) : (
                  // -- Image Entry -- 
                  <div className="whitespace-pre-wrap line-height-loose  text-xl">
                    {entry.content}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        
        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&family=Kalam&display=swap");`}
        </style>
        
        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          itemType="diary entry"
        />
        

          </div>
      )}
    </EntryLockProtection>
  );
} 