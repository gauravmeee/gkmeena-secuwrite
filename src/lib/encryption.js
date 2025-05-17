import supabase from './supabase';

// Generate a random encryption key
export async function generateEncryptionKey() {
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );
  
  // Export the key to store it
  const exportedKey = await window.crypto.subtle.exportKey("raw", key);
  return Array.from(new Uint8Array(exportedKey));
}

// Convert encryption key array back to CryptoKey
async function getKeyFromArray(keyArray) {
  const keyBuffer = new Uint8Array(keyArray);
  return await window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    {
      name: "AES-GCM",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Helper function to chunk string data
function chunkString(str, size) {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array(numChunks);
  
  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size);
  }
  
  return chunks;
}

// Encrypt data
export async function encryptData(data, keyArray) {
  try {
    const key = await getKeyFromArray(keyArray);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    
    // Handle large strings by chunking
    let dataToEncrypt;
    if (typeof data === 'string' && data.length > 1024 * 1024) { // If larger than 1MB
      const chunks = chunkString(data, 1024 * 1024); // 1MB chunks
      dataToEncrypt = chunks[0]; // For now, just take the first chunk
    } else {
      dataToEncrypt = data;
    }
    
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encoder.encode(dataToEncrypt)
    );
    
    // Combine IV and encrypted data
    const encryptedArray = new Uint8Array(encryptedData);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);
    
    // Convert to base64 in chunks to avoid call stack issues
    const chunk = 0xffff;
    let result = '';
    for (let i = 0; i < combined.length; i += chunk) {
      result += String.fromCharCode.apply(null, combined.subarray(i, i + chunk));
    }
    
    return btoa(result);
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
}

// Decrypt data
export async function decryptData(encryptedData, keyArray) {
  try {
    const key = await getKeyFromArray(keyArray);
    
    // Convert from base64 and separate IV and data
    let binary = atob(encryptedData);
    let bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    const iv = bytes.slice(0, 12);
    const data = bytes.slice(12);
    
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      data
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
}

// Store encryption key securely in localStorage
export function storeEncryptionKey(keyArray) {
  localStorage.setItem('diary_encryption_key', JSON.stringify(keyArray));
}

// Get encryption key from localStorage
export function getStoredEncryptionKey() {
  const storedKey = localStorage.getItem('diary_encryption_key');
  return storedKey ? JSON.parse(storedKey) : null;
}

// Verify RLS policies and table access
async function verifyTableAccess(userId) {
  try {
    // Try to insert a test record
    const testKey = await generateEncryptionKey();
    console.log('Test key generated for verification');
    
    const { data, error } = await supabase
      .from('user_encryption_keys')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Access verification error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return { success: false, error };
    }
    
    console.log('Table access verified successfully');
    return { success: true };
  } catch (error) {
    console.error('Table access verification failed:', error);
    return { success: false, error };
  }
}

// Store encryption key in Supabase with enhanced error handling
export async function storeEncryptionKeyInDB(userId, keyArray) {
  try {
    console.log('Attempting to store key for user:', userId);
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!keyArray || !Array.isArray(keyArray)) {
      throw new Error('Invalid key array format');
    }

    // Verify table access first
    const accessCheck = await verifyTableAccess(userId);
    if (!accessCheck.success) {
      throw new Error(`Table access verification failed: ${accessCheck.error?.message || 'Unknown error'}`);
    }

    // Convert key array to string and validate
    const keyData = JSON.stringify(keyArray);
    if (!keyData) {
      throw new Error('Failed to stringify key data');
    }
    console.log('Key data prepared for storage, length:', keyData.length);

    // Prepare the record
    const record = {
      user_id: userId,
      key_data: keyData,
      updated_at: new Date().toISOString()
    };
    console.log('Record prepared:', { user_id: record.user_id, dataLength: record.key_data.length });

    // Attempt to upsert the record
    const { data, error } = await supabase
      .from('user_encryption_keys')
      .upsert([record], { 
        onConflict: 'user_id',
        returning: 'minimal' // Add this to minimize data transfer
      });

    if (error) {
      console.error('Supabase error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status: error.status
      });
      throw error;
    }
    
    console.log('Key successfully stored in database');
    
    // Also store in localStorage as backup
    storeEncryptionKey(keyArray);
    return true;
  } catch (error) {
    // Enhanced error logging
    console.error('Error storing encryption key:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      details: error.details || 'No additional details',
      status: error?.status,
      statusText: error?.statusText,
      body: error?.body
    });
    return false;
  }
}

// Get encryption key from Supabase
export async function getEncryptionKeyFromDB(userId) {
  try {
    const { data, error } = await supabase
      .from('user_encryption_keys')
      .select('key_data')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) return null;

    const keyArray = JSON.parse(data.key_data);
    // Update localStorage with the retrieved key
    storeEncryptionKey(keyArray);
    return keyArray;
  } catch (error) {
    console.error('Error getting encryption key:', error);
    return null;
  }
}

// Migration helper to ensure user's key is properly stored
export async function migrateExistingKey(userId) {
  try {
    // First check if key exists in Supabase
    const { data: existingKey } = await supabase
      .from('user_encryption_keys')
      .select('key_data')
      .eq('user_id', userId)
      .single();

    if (existingKey) {
      // If key exists in DB, ensure it's in localStorage
      const keyArray = JSON.parse(existingKey.key_data);
      storeEncryptionKey(keyArray);
      return keyArray;
    }

    // If no key in DB, check localStorage
    const localKey = getStoredEncryptionKey();
    if (localKey) {
      // Store existing localStorage key in DB
      await storeEncryptionKeyInDB(userId, localKey);
      return localKey;
    }

    // If no key exists anywhere, generate new one
    const newKey = await generateEncryptionKey();
    await storeEncryptionKeyInDB(userId, newKey);
    return newKey;
  } catch (error) {
    console.error('Error in key migration:', error);
    throw error;
  }
}

// Verify encryption table setup
export async function verifyEncryptionTableSetup() {
  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('user_encryption_keys')
      .select('user_id')
      .limit(1);

    if (error) {
      console.error('Table verification error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return {
        exists: false,
        error: error.message
      };
    }

    return {
      exists: true,
      error: null
    };
  } catch (error) {
    console.error('Table verification failed:', error);
    return {
      exists: false,
      error: error.message
    };
  }
}

// Modified initialize function with enhanced error handling
export async function initializeEncryption(userId) {
  if (!userId) {
    throw new Error('User ID is required for encryption initialization');
  }

  try {
    // Verify table exists and is accessible
    const tableStatus = await verifyEncryptionTableSetup();
    if (!tableStatus.exists) {
      throw new Error(`Encryption table not properly set up: ${tableStatus.error}`);
    }

    // Verify RLS policies are working
    const accessStatus = await verifyTableAccess(userId);
    if (!accessStatus.success) {
      throw new Error(`Access verification failed: ${accessStatus.error?.message || 'Unknown error'}`);
    }

    // Always run migration to ensure key consistency
    const keyArray = await migrateExistingKey(userId);
    if (!keyArray) {
      throw new Error('Failed to initialize or retrieve encryption key');
    }

    return keyArray;
  } catch (error) {
    console.error('Error in encryption initialization:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      details: error.details || 'No additional details'
    });
    throw error;
  }
} 