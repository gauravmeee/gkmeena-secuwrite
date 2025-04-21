import { supabase } from './supabase';
import { generateEncryptionKey } from './encryption';

// Generate a recovery key for the user
export function generateRecoveryKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = 4;
  const segmentLength = 5;
  let recoveryKey = '';
  
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segmentLength; j++) {
      recoveryKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < segments - 1) recoveryKey += '-';
  }
  
  return recoveryKey;
}

// Encrypt the encryption key using the recovery key
async function encryptKeyWithRecoveryKey(keyArray, recoveryKey) {
  const encoder = new TextEncoder();
  const recoveryKeyBuffer = encoder.encode(recoveryKey);
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  
  // Derive a key from the recovery key
  const derivedKey = await window.crypto.subtle.importKey(
    'raw',
    recoveryKeyBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const encryptionKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    derivedKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const keyArrayBuffer = new Uint8Array(keyArray).buffer;
  
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    encryptionKey,
    keyArrayBuffer
  );
  
  // Combine salt, iv, and encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedData), salt.length + iv.length);
  
  return btoa(String.fromCharCode.apply(null, combined));
}

// Decrypt the encryption key using the recovery key
async function decryptKeyWithRecoveryKey(encryptedKeyString, recoveryKey) {
  const encoder = new TextEncoder();
  const recoveryKeyBuffer = encoder.encode(recoveryKey);
  const encryptedData = new Uint8Array(atob(encryptedKeyString).split('').map(c => c.charCodeAt(0)));
  
  const salt = encryptedData.slice(0, 16);
  const iv = encryptedData.slice(16, 28);
  const data = encryptedData.slice(28);
  
  const derivedKey = await window.crypto.subtle.importKey(
    'raw',
    recoveryKeyBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const decryptionKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    derivedKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    decryptionKey,
    data
  );
  
  return Array.from(new Uint8Array(decryptedData));
}

// Store encryption key for a specific user
export function storeEncryptionKey(userId, keyArray) {
  localStorage.setItem(`encryption_key_${userId}`, JSON.stringify(keyArray));
}

// Get stored encryption key for a specific user
export function getStoredEncryptionKey(userId) {
  const storedKey = localStorage.getItem(`encryption_key_${userId}`);
  return storedKey ? JSON.parse(storedKey) : null;
}

// Initialize encryption for a user
export async function initializeUserEncryption(userId) {
  try {
    // Check if key exists in localStorage
    let keyArray = getStoredEncryptionKey(userId);
    
    if (!keyArray) {
      // Check if key exists in server backup
      const { data: keyData } = await supabase
        .from('user_encryption_keys')
        .select('encrypted_key')
        .eq('user_id', userId)
        .single();
      
      if (keyData?.encrypted_key) {
        // Prompt user for recovery key
        const recoveryKey = prompt('Please enter your recovery key to restore your encryption key:');
        if (recoveryKey) {
          try {
            keyArray = await decryptKeyWithRecoveryKey(keyData.encrypted_key, recoveryKey);
            storeEncryptionKey(userId, keyArray);
          } catch (error) {
            console.error('Error decrypting key:', error);
            throw new Error('Invalid recovery key');
          }
        }
      }
      
      if (!keyArray) {
        // Generate new key if none exists
        keyArray = await generateEncryptionKey();
        storeEncryptionKey(userId, keyArray);
        
        // Generate and show recovery key to user
        const recoveryKey = generateRecoveryKey();
        const encryptedKey = await encryptKeyWithRecoveryKey(keyArray, recoveryKey);
        
        // Save encrypted key to server
        await supabase
          .from('user_encryption_keys')
          .upsert({
            user_id: userId,
            encrypted_key: encryptedKey,
            updated_at: new Date().toISOString()
          });
        
        // Show recovery key to user
        alert(`Please save this recovery key in a safe place. You will need it to recover your data if you lose access:\n\n${recoveryKey}\n\nDo not share this key with anyone!`);
      }
    }
    
    return keyArray;
  } catch (error) {
    console.error('Error initializing encryption:', error);
    throw error;
  }
}

// Recover encryption key using recovery key
export async function recoverEncryptionKey(userId, recoveryKey) {
  try {
    const { data: keyData } = await supabase
      .from('user_encryption_keys')
      .select('encrypted_key')
      .eq('user_id', userId)
      .single();
    
    if (!keyData?.encrypted_key) {
      throw new Error('No backup key found for this user');
    }
    
    const keyArray = await decryptKeyWithRecoveryKey(keyData.encrypted_key, recoveryKey);
    storeEncryptionKey(userId, keyArray);
    return keyArray;
  } catch (error) {
    console.error('Error recovering encryption key:', error);
    throw error;
  }
}

// Export key for backup
export function exportEncryptionKey(userId) {
  const keyArray = getStoredEncryptionKey(userId);
  if (!keyArray) throw new Error('No encryption key found');
  return btoa(JSON.stringify(keyArray));
}

// Import key from backup
export function importEncryptionKey(userId, exportedKey) {
  try {
    const keyArray = JSON.parse(atob(exportedKey));
    storeEncryptionKey(userId, keyArray);
    return keyArray;
  } catch (error) {
    console.error('Error importing encryption key:', error);
    throw new Error('Invalid backup key format');
  }
} 