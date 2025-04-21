import supabase from './supabase';

// Helper function to convert image file to base64
async function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Diary entry functions
export async function getDiaryEntries(userId) {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching diary entries:', error);
    return [];
  }
  
  return data || [];
}

export async function createDiaryEntry(userId, entry) {
  try {
    let imageData = null;
    
    // If there's an image file, convert it to base64
    if (entry.imageFile) {
      try {
        imageData = await imageToBase64(entry.imageFile);
      } catch (error) {
        console.error("Error converting image to base64:", error);
        // Continue without the image if conversion fails
      }
    }

    // Prepare the entry data
    const entryData = {
      user_id: userId,
      title: entry.title || "",
      content: entry.content || "",
      date: entry.date || new Date().toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      time: entry.time || new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }),
      has_manual_title: entry.hasManualTitle || false,
      entry_type: imageData ? 'image' : 'text'
    };

    // If we have image data, store it in the content field
    if (imageData) {
      entryData.content = imageData;
    }

    // Insert the entry
    const { data, error } = await supabase
      .from('diary_entries')
      .insert([entryData])
      .select();

    if (error) {
      console.error("Error creating diary entry:", error);
      throw error;
    }

    return data[0];
  } catch (error) {
    console.error("Error in createDiaryEntry:", error);
    throw error;
  }
}

export async function updateDiaryEntry(entryId, updates, userId) {
  try {
    // Validate inputs
    if (!entryId || !userId) {
      console.error("Missing required parameters:", { entryId, userId });
      return null;
    }

    console.log("Starting update with:", { entryId, userId, updates });

    // First verify the entry exists and belongs to the user
    const { data: existingEntry, error: fetchError } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error("Error fetching entry:", fetchError);
      return null;
    }

    if (!existingEntry) {
      console.error("Entry not found or doesn't belong to user");
      return null;
    }

    console.log("Found existing entry:", existingEntry);

    let imageData = null;

    // If there's a new image file, convert it to base64
    if (updates.imageFile) {
      imageData = await imageToBase64(updates.imageFile);
    }

    // Prepare the update data
    const updateData = {
      title: updates.title || '',
      content: imageData || updates.content || existingEntry.content || '',
      date: updates.date || existingEntry.date || '',
      time: updates.time || existingEntry.time || '',
      has_manual_title: updates.hasManualTitle || false,
      entry_type: imageData ? 'image' : (updates.content ? 'text' : existingEntry.entry_type),
      updated_at: new Date().toISOString()
    };

    console.log("Prepared update data:", updateData);

    // Perform the update
    const { data, error } = await supabase
      .from('diary_entries')
      .update(updateData)
      .eq('id', entryId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      console.error("Supabase update error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }

    if (!data) {
      console.error("No data returned from update");
      return null;
    }

    console.log("Update successful:", data);
    return data;
  } catch (error) {
    console.error("Error in updateDiaryEntry:", {
      message: error.message,
      stack: error.stack
    });
    return null;
  }
}

export async function deleteDiaryEntry(entryId, userId) {
  if (!userId) return false;
  
  const { error } = await supabase
    .from('diary_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId); // Security check
    
  if (error) {
    console.error('Error deleting diary entry:', error);
    return false;
  }
  
  return true;
}

export async function deleteManyDiaryEntries(userId, entryIds) {
  if (!userId || !entryIds || entryIds.length === 0) return false;
  
  const { error } = await supabase
    .from('diary_entries')
    .delete()
    .eq('user_id', userId)
    .in('id', entryIds);
    
  if (error) {
    console.error('Error deleting multiple diary entries:', error);
    return false;
  }
  
  return true;
}

// Journal entry functions
export async function getJournalEntries(userId) {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching journal entries:', error);
    return [];
  }
  
  return data || [];
}

export async function createJournalEntry(userId, entry) {
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('journal_entries')
    .insert([{
      user_id: userId,
      title: entry.title,
      content: entry.content,
      date: entry.date,
      created_at: new Date().toISOString()
    }])
    .select();
    
  if (error) {
    console.error('Error creating journal entry:', error);
    return null;
  }
  
  return data?.[0] || null;
}

export async function updateJournalEntry(entryId, updates, userId) {
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('journal_entries')
    .update({
      title: updates.title,
      content: updates.content,
      updated_at: new Date().toISOString()
    })
    .eq('id', entryId)
    .eq('user_id', userId) // Security check
    .select();
    
  if (error) {
    console.error('Error updating journal entry:', error);
    return null;
  }
  
  return data?.[0] || null;
}

export async function deleteJournalEntry(entryId, userId) {
  if (!userId) return false;
  
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId); // Security check
    
  if (error) {
    console.error('Error deleting journal entry:', error);
    return false;
  }
  
  return true;
}

export async function deleteManyJournalEntries(userId, entryIds) {
  if (!userId || !entryIds || entryIds.length === 0) return false;
  
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('user_id', userId)
    .in('id', entryIds);
    
  if (error) {
    console.error('Error deleting multiple journal entries:', error);
    return false;
  }
  
  return true;
}

export async function getJournalEntry(entryId, userId) {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error getting journal entry:', error);
      return null;
    }

    // Ensure content is properly returned
    if (data && typeof data.content === 'string') {
      return {
        ...data,
        content: data.content
      };
    }

    return data;
  } catch (error) {
    console.error('Error getting journal entry:', error);
    return null;
  }
}

// Helper function to check table structure
// Removing this function since the RPC doesn't exist
// export async function checkTableStructure() {
//   try {
//     // Query table definition
//     const { data, error } = await supabase
//       .rpc('get_table_definition', { table_name: 'diary_entries' });
//       
//     if (error) {
//       console.error('Error getting table definition:', error);
//       return null;
//     }
//     
//     console.log('Table definition:', data);
//     return data;
//   } catch (err) {
//     console.error('Error checking table structure:', err);
//     return null;
//   }
// }

// Export all functions as a single object for easier importing
const databaseUtils = {
  getDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
  deleteManyDiaryEntries,
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  deleteManyJournalEntries,
  getJournalEntry,
  // Removing this since the function is removed
  // checkTableStructure
};

export default databaseUtils; 