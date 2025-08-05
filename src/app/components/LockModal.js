"use client";

import { useState, useEffect } from "react";
import { FiLock, FiUnlock, FiEye, FiEyeOff, FiX, FiInfo } from "react-icons/fi";
import { useLock } from "../../context/LockContext";

export default function LockModal({ isOpen, onClose, mode = "unlock" }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lockJournal, setLockJournal] = useState(false);
  const [showSetupInstructions, setShowSetupInstructions] = useState(false);
  
  const { 
    setPassword: setGlobalPassword, 
    removePassword, 
    changePassword, 
    unlock, 
    lock,
    updateLockJournal: setGlobalLockJournal
  } = useLock();

  // Clear password fields when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setConfirmPassword("");
      setError("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowSetupInstructions(false);
    }
  }, [isOpen, mode]);

  const clearPasswordFields = () => {
    setPassword("");
    setConfirmPassword("");
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "set") {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        if (password.length < 4) {
          setError("Password must be at least 4 characters");
          return;
        }
        
        const result = await setGlobalPassword(password, lockJournal);
        if (result.success) {
          clearPasswordFields();
          onClose();
        } else {
          setError(result.error);
          // Show setup instructions if table doesn't exist
          if (result.error && result.error.includes('Database table not set up')) {
            setShowSetupInstructions(true);
          }
        }
      } else if (mode === "change") {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        if (password.length < 4) {
          setError("Password must be at least 4 characters");
          return;
        }
        
        const result = await changePassword(password);
        if (result.success) {
          clearPasswordFields();
          onClose();
        } else {
          setError(result.error);
          if (result.error && result.error.includes('Database table not set up')) {
            setShowSetupInstructions(true);
          }
        }
      } else if (mode === "unlock") {
        const result = await unlock(password);
        if (result.success) {
          clearPasswordFields();
          onClose();
        } else {
          setError(result.error);
          // Clear password field on failed attempt for security
          setPassword("");
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      clearPasswordFields();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLock = async () => {
    try {
      setIsLoading(true);
      const result = await removePassword();
      if (result.success) {
        clearPasswordFields();
        onClose();
      } else {
        setError(result.error);
        if (result.error && result.error.includes('Database table not set up')) {
          setShowSetupInstructions(true);
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLock = () => {
    lock();
    clearPasswordFields();
    onClose();
  };

  const handleClose = () => {
    clearPasswordFields();
    onClose();
  };

  if (!isOpen) return null;

  const getModalTitle = () => {
    switch (mode) {
      case "set": return "Set Lock Password";
      case "change": return "Change Password";
      case "unlock": return "Unlock Application";
      default: return "Lock Settings";
    }
  };

  const getModalIcon = () => {
    switch (mode) {
      case "set": return <FiLock size={24} />;
      case "change": return <FiLock size={24} />;
      case "unlock": return <FiUnlock size={24} />;
      default: return <FiLock size={24} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-16">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="text-primary">
              {getModalIcon()}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {getModalTitle()}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {showSetupInstructions && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <FiInfo className="text-blue-500 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Database Setup Required</h3>
                <p className="text-blue-800 text-sm mb-3">
                  The lock feature requires a database table to be created first.
                </p>
                <div className="text-xs text-blue-700 bg-blue-100 p-3 rounded border">
                  <strong>Quick Setup:</strong><br/>
                  1. Go to Supabase Dashboard → SQL Editor<br/>
                  2. Run the SQL from <code className="bg-blue-200 px-1 rounded">setup_lock_table.sql</code><br/>
                  3. Refresh this page and try again
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "set" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                    placeholder="Enter password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                    placeholder="Confirm password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lockJournal"
                  checked={lockJournal}
                  onChange={(e) => setLockJournal(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <label htmlFor="lockJournal" className="text-sm text-gray-700">
                  Also lock Journal entries
                </label>
              </div>
            </div>
          )}

          {mode === "change" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                    placeholder="Enter new password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                    placeholder="Confirm new password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === "unlock" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {mode === "set" && (
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Setting..." : "Set Password"}
              </button>
            )}

            {mode === "change" && (
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Changing..." : "Change Password"}
              </button>
            )}

            {mode === "unlock" && (
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Unlocking..." : "Unlock"}
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
} 