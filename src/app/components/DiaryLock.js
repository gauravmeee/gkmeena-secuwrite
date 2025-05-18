"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiLock, FiUnlock } from 'react-icons/fi';
import supabase from '../../lib/supabase';
import { encryptData, decryptData, initializeEncryption } from '../../lib/encryption';

export default function DiaryLock({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    checkLockSetup();
  }, [user]);

  const checkLockSetup = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('diary_lock_passwords')
        .select('password_hash')
        .eq('user_id', user.id)
        .single();

      setIsSettingUp(!data);
      setLoading(false);
    } catch (error) {
      console.error('Error checking lock setup:', error);
      setError('Failed to check lock status');
      setLoading(false);
    }
  };

  const handleSetupLock = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      // Initialize encryption with user ID
      const keyArray = await initializeEncryption(user.id);
      
      // Encrypt the password
      const encryptedPassword = await encryptData(password, keyArray);

      const { error: insertError } = await supabase
        .from('diary_lock_passwords')
        .insert([{
          user_id: user.id,
          password_hash: encryptedPassword
        }]);

      if (insertError) throw insertError;

      setIsSettingUp(false);
      onUnlock();
    } catch (error) {
      console.error('Error setting up lock:', error);
      setError('Failed to set up lock');
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { data } = await supabase
        .from('diary_lock_passwords')
        .select('password_hash')
        .eq('user_id', user.id)
        .single();

      if (!data) {
        setError('Lock not set up');
        return;
      }

      // Initialize encryption with user ID
      const keyArray = await initializeEncryption(user.id);
      
      // Decrypt and compare passwords
      const decryptedStoredPassword = await decryptData(data.password_hash, keyArray);

      if (password === decryptedStoredPassword) {
        onUnlock();
      } else {
        setError('Incorrect password');
      }
    } catch (error) {
      console.error('Error unlocking:', error);
      setError('Failed to unlock');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background diary entries - blurred and non-interactive */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="max-w-4xl mx-auto pt-24 px-4 pb-20 opacity-50">
          <div className="grid grid-cols-1 gap-5">
            {/* Dummy diary entries for visual effect */}
            {[1, 2, 3].map((index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
                <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-4 border-b border-gray-200">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                </div>
                <div className="lined-paper p-4 bg-white min-h-[200px]">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lock screen overlay */}
      <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50">
        <div className="w-full max-w-md p-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
          <div className="flex justify-center mb-6">
            {isSettingUp ? (
              <div className="bg-primary/10 p-4 rounded-full">
                <FiLock size={32} className="text-primary" />
              </div>
            ) : (
              <div className="bg-primary/10 p-4 rounded-full">
                <FiUnlock size={32} className="text-primary" />
              </div>
            )}
          </div>
          
          <h2 className="text-xl font-bold text-center mb-8 text-white">
            {isSettingUp ? 'Set Up Diary Lock' : 'Unlock Your Diary'}
          </h2>

          <form onSubmit={isSettingUp ? handleSetupLock : handleUnlock} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {isSettingUp ? 'Create Password' : 'Enter Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 text-white border border-white/20 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-white/50"
                placeholder="••••••••"
                required
              />
            </div>

            {isSettingUp && (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/10 text-white border border-white/20 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-white/50"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-4 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white py-2 px-3 textsm rounded-lg transition-colors font-medium cursor-pointer"
            >
              {isSettingUp ? 'Set Password' : 'Unlock'}
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .lined-paper {
          background-color: white;
          background-image: 
            linear-gradient(90deg, transparent 39px, #d6aed6 39px, #d6aed6 41px, transparent 41px),
            linear-gradient(#e5e7eb 1px, transparent 1px);
          background-size: 100% 2rem;
          line-height: 2rem;
          padding-left: 45px !important;
        }
      `}</style>
    </div>
  );
} 