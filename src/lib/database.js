import supabase from './supabase';
import { encryptData, decryptData, initializeEncryption } from './encryption';

// Helper function to convert image file to base64
async function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!(file instanceof File || file instanceof Blob)) {
      reject(new Error('Invalid file object'));
      return;
    }

    // Check file size
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      reject(new Error('File size too large. Maximum size is 10MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Helper function to handle content encryption based on type
async function encryptContent(content, type, keyArray) {
  try {
    if (!content) return null;
    
    if (type === 'image') {
      if (content instanceof File || content instanceof Blob) {
        try {
          const base64Data = await imageToBase64(content);
          return await encryptData(base64Data, keyArray);
        } catch (error) {
          console.error('Error converting image:', error);
          throw error;
        }
      } else if (typeof content === 'string' && content.startsWith('data:')) {
        return await encryptData(content, keyArray);
      } else {
        throw new Error('Invalid image data format');
      }
    }
    
    // For text content
    return await encryptData(content.toString(), keyArray);
  } catch (error) {
    console.error('Error in encryptContent:', error);
    throw error;
  }
}

// Helper function to handle content decryption based on type
async function decryptContent(content, type, keyArray) {
  try {
    if (!content) return '';
    
    const decryptedData = await decryptData(content, keyArray);
    
    if (type === 'image' && !decryptedData.startsWith('data:')) {
      // If it's an image and doesn't have the data URL prefix, add it
      return `data:image/jpeg;base64,${decryptedData}`;
    }
    
    return decryptedData;
  } catch (error) {
    console.error('Error in decryptContent:', error);
    throw error;
  }
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
  
  // Initialize encryption
  const keyArray = await initializeEncryption();

  // Decrypt entries
  const decryptedEntries = await Promise.all(data.map(async (entry) => {
    try {
      return {
        ...entry,
        title: entry.title ? await decryptData(entry.title, keyArray) : '',
        content: entry.content ? await decryptContent(entry.content, entry.entry_type, keyArray) : ''
      };
    } catch (error) {
      console.error('Error decrypting entry:', error);
      return entry;
    }
  }));

  return decryptedEntries;
}

export async function createDiaryEntry(userId, entry) {
  try {
    if (!userId) throw new Error('User ID is required');

    // Initialize encryption
    const keyArray = await initializeEncryption();
    
    // Determine entry type and validate content
    const entryType = entry.imageFile ? 'image' : 'text';
    const contentToEncrypt = entryType === 'image' ? entry.imageFile : entry.content;
    
    if (!contentToEncrypt) {
      throw new Error('Content is required');
    }

    // For images, validate size before processing
    if (entryType === 'image' && contentToEncrypt instanceof File) {
      if (contentToEncrypt.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Image file size too large. Maximum size is 10MB.');
      }
    }

    // Encrypt the content
    const encryptedContent = await encryptContent(contentToEncrypt, entryType, keyArray);
    if (!encryptedContent) {
      throw new Error('Failed to encrypt content');
    }
    
    // Encrypt title if it exists
    const encryptedTitle = entry.title ? await encryptData(entry.title, keyArray) : null;
    
    // Prepare the entry data
    const entryData = {
      user_id: userId,
      title: encryptedTitle,
      content: encryptedContent,
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
      entry_type: entryType,
      created_at: new Date().toISOString()
    };

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
    if (!entryId || !userId) {
      throw new Error("Missing required parameters");
    }

    // Initialize encryption
    const keyArray = await initializeEncryption();

    // Determine if this is an image update
    const isImageUpdate = updates.imageFile !== undefined;
    const entryType = isImageUpdate ? 'image' : 'text';
    const contentToEncrypt = isImageUpdate ? updates.imageFile : updates.content;

    // Encrypt content if it exists
    let encryptedContent = null;
    if (contentToEncrypt) {
      encryptedContent = await encryptContent(contentToEncrypt, entryType, keyArray);
    }

    // Encrypt title if it exists
    let encryptedTitle = null;
    if (updates.title !== undefined) {
      encryptedTitle = updates.title ? await encryptData(updates.title, keyArray) : null;
    }

    // First verify the entry exists and belongs to the user
    const { data: existingEntry, error: fetchError } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingEntry) {
      throw new Error("Entry not found or access denied");
    }

    // Prepare the update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Only include fields that are being updated
    if (encryptedContent !== null) {
      updateData.content = encryptedContent;
      updateData.entry_type = entryType;
    }
    if (encryptedTitle !== null) {
      updateData.title = encryptedTitle;
    }
    if (updates.hasManualTitle !== undefined) {
      updateData.has_manual_title = updates.hasManualTitle;
    }

    // Perform the update
    const { data, error } = await supabase
      .from('diary_entries')
      .update(updateData)
      .eq('id', entryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in updateDiaryEntry:", error);
    throw error;
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