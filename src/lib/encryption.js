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

// Initialize or get existing encryption key
export async function initializeEncryption() {
  let keyArray = getStoredEncryptionKey();
  if (!keyArray) {
    keyArray = await generateEncryptionKey();
    storeEncryptionKey(keyArray);
  }
  return keyArray;
} 