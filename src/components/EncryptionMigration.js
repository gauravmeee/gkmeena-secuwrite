import { useState, useEffect } from 'react';
import { reEncryptUserData } from '../lib/database';
import { migrateExistingKey, verifyEncryptionTableSetup } from '../lib/encryption';

export default function EncryptionMigration({ userId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Automatically check encryption status
    const checkEncryption = async () => {
      try {
        const status = await verifyEncryptionTableSetup();
        if (!status.exists) {
          setShowMigration(true);
          setError('Encryption setup needed');
        }
      } catch (error) {
        console.error('Encryption check failed:', error);
        setShowMigration(true);
        setError('Encryption verification failed');
      }
    };
    checkEncryption();
  }, []);

  const handleMigration = async () => {
    try {
      setIsLoading(true);
      await migrateExistingKey(userId);
      await reEncryptUserData(userId);
      setShowMigration(false);
      setError('');
    } catch (error) {
      console.error('Migration error:', error);
      setError('Failed to fix encryption');
    } finally {
      setIsLoading(false);
    }
  };

  if (!showMigration) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-yellow-50 shadow-lg rounded-lg p-3 max-w-xs">
        <button
          onClick={handleMigration}
          disabled={isLoading}
          className="text-sm text-yellow-700 hover:text-yellow-800 flex items-center gap-2"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></span>
              Fixing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {error ? '🔄' : '🔐'} Fix encryption issues
            </span>
          )}
        </button>
      </div>
    </div>
  );
} 