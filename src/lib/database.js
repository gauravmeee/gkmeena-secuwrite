import supabase from './supabase';

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
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('diary_entries')
      .insert([
        {
          user_id: userId,
          title: entry.title || "",
          content: entry.content || "",
          date: entry.date || new Date().toLocaleDateString('en-US', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }),
          day: entry.day || new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          time: entry.time || new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          }),
          has_manual_title: entry.hasManualTitle || false
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating diary entry:", error);
    return null;
  }
}

export async function updateDiaryEntry(entryId, userId, updates) {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('diary_entries')
      .update({
        title: updates.title || "",
        content: updates.content || "",
        date: updates.date || new Date().toLocaleDateString('en-US', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }),
        day: updates.day || new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        time: updates.time || new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        }),
        has_manual_title: updates.hasManualTitle || false
      })
      .eq('id', entryId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating diary entry:", error);
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
  // Removing this since the function is removed
  // checkTableStructure
};

export default databaseUtils; 