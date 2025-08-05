import { supabase } from './supabase';
import { sha256 } from 'js-sha256';

class LockService {
  // Hash password using SHA-256
  hashPassword(password) {
    return sha256(password);
  }

  // Get user's lock settings from database
  async getLockSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('user_lock_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If table doesn't exist or other database errors, return default settings silently
        if (error.code === 'PGRST116' || (error.message && error.message.includes('relation "user_lock_settings" does not exist'))) {
          return {
            has_password: false,
            lock_journal: false,
            password_hash: null
          };
        }
        // For other errors, log but still return default settings
        console.warn('Database error fetching lock settings:', error);
        return {
          has_password: false,
          lock_journal: false,
          password_hash: null
        };
      }

      return data || {
        has_password: false,
        lock_journal: false,
        password_hash: null
      };
    } catch (error) {
      // Catch any unexpected errors and return default settings
      console.error('Unexpected error in getLockSettings:', error);
      return {
        has_password: false,
        lock_journal: false,
        password_hash: null
      };
    }
  }

  // Set password and lock settings
  async setPassword(userId, password, lockJournal = false) {
    try {
      const passwordHash = this.hashPassword(password);
      
      const { data, error } = await supabase
        .from('user_lock_settings')
        .upsert({
          user_id: userId,
          has_password: true,
          password_hash: passwordHash,
          lock_journal: lockJournal
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        // If table doesn't exist, show helpful error
        if (error.message && error.message.includes('relation "user_lock_settings" does not exist')) {
          return { 
            success: false, 
            error: 'Database table not set up. Please run the migration first.' 
          };
        }
        
        console.error('Database error setting password:', error);
        return { 
          success: false, 
          error: `Database error: ${error.message || 'Unknown database error'}` 
        };
      }
      
      return { success: true, data };
    } catch (error) {
      // Check if it's a table doesn't exist error
      if (error.message && error.message.includes('relation "user_lock_settings" does not exist')) {
        return { 
          success: false, 
          error: 'Database table not set up. Please run the migration first.' 
        };
      }
      
      console.error('Unexpected error in setPassword:', error);
      return { 
        success: false, 
        error: `Unexpected error: ${error.message || 'Unknown error occurred'}` 
      };
    }
  }

  // Change password
  async changePassword(userId, newPassword) {
    try {
      const passwordHash = this.hashPassword(newPassword);
      
      const { data, error } = await supabase
        .from('user_lock_settings')
        .update({
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.message && error.message.includes('relation "user_lock_settings" does not exist')) {
          return { 
            success: false, 
            error: 'Database table not set up. Please run the migration first.' 
          };
        }
        throw error;
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  // Remove password (disable lock)
  async removePassword(userId) {
    try {
      const { error } = await supabase
        .from('user_lock_settings')
        .delete()
        .eq('user_id', userId);

      if (error) {
        if (error.message && error.message.includes('relation "user_lock_settings" does not exist')) {
          return { 
            success: false, 
            error: 'Database table not set up. Please run the migration first.' 
          };
        }
        throw error;
      }
      return { success: true };
    } catch (error) {
      console.error('Error removing password:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  // Verify password
  async verifyPassword(userId, password) {
    try {
      const { data, error } = await supabase
        .from('user_lock_settings')
        .select('password_hash')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.message && error.message.includes('relation "user_lock_settings" does not exist')) {
          return { 
            success: false, 
            error: 'Database table not set up. Please run the migration first.' 
          };
        }
        throw error;
      }
      
      if (!data || !data.password_hash) {
        return { success: false, error: 'No password set' };
      }

      const inputHash = this.hashPassword(password);
      const isValid = inputHash === data.password_hash;

      return { success: isValid, error: isValid ? null : 'Incorrect password' };
    } catch (error) {
      console.error('Error verifying password:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  // Update lock journal setting
  async updateLockJournal(userId, lockJournal) {
    try {
      const { data, error } = await supabase
        .from('user_lock_settings')
        .update({
          lock_journal: lockJournal,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.message && error.message.includes('relation "user_lock_settings" does not exist')) {
          return { 
            success: false, 
            error: 'Database table not set up. Please run the migration first.' 
          };
        }
        throw error;
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error updating lock journal setting:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }
}

export default new LockService(); 