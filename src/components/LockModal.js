"use client";

import { useState, useEffect } from "react";
import { FiLock, FiUnlock, FiEye, FiEyeOff, FiX, FiInfo, FiMail, FiKey } from "react-icons/fi";
import { useLock } from "../context/LockContext";
import { useAuth } from "../context/AuthContext";
import OTPInstructions from "./OTPInstructions";

export default function LockModal({ isOpen, onClose, mode = "unlock" }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lockJournal, setLockJournal] = useState(false);
  const [showSetupInstructions, setShowSetupInstructions] = useState(false);
  
  // OTP-related states
  const [otpStep, setOtpStep] = useState("email"); // "email", "otp", "newPassword"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState(""); // For development mode
  
  const { 
    setPassword: setGlobalPassword, 
    removePassword, 
    changePassword, 
    unlock, 
    lock,
    updateLockJournal: setGlobalLockJournal
  } = useLock();
  
  const { user } = useAuth();

  // Clear password fields when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setConfirmPassword("");
      setError("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowSetupInstructions(false);
      
      // Reset OTP states
      setOtpStep("email");
      setEmail("");
      setOtp("");
      setOtpSent(false);
      setOtpVerified(false);
      setResendCooldown(0);
      setDevOtp("");
      
      // Set email from user if available
      if (user?.email) {
        setEmail(user.email);
      }
    }
  }, [isOpen, mode, user]);

  const clearPasswordFields = () => {
    setPassword("");
    setConfirmPassword("");
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Send OTP to email
  const sendOTP = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/otp/send-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setOtpSent(true);
        setOtpStep("otp");
        setError("");
        // Start cooldown timer (60 seconds)
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // In development mode, show the OTP
        if (result.otp) {
          console.log(`Development OTP for ${email}: ${result.otp}`);
          setDevOtp(result.otp);
        }
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const result = await response.json();

      if (result.success) {
        setOtpVerified(true);
        setOtpStep("newPassword");
        setError("");
      } else {
        setError(result.error || 'Invalid OTP');
        setOtp("");
      }
    } catch (error) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password with OTP verification
  const resetPasswordWithOTP = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/otp/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword: password }),
      });

      const result = await response.json();

      if (result.success) {
        clearPasswordFields();
        onClose(true);
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (error) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          onClose(true); // Pass true for successful operation
        } else {
          setError(result.error);
          // Show setup instructions if table doesn't exist
          if (result.error && result.error.includes('Database table not set up')) {
            setShowSetupInstructions(true);
          }
        }
      } else if (mode === "change") {
        // For password change, use OTP verification
        if (otpStep === "email") {
          await sendOTP();
          return;
        } else if (otpStep === "otp") {
          await verifyOTP();
          return;
        } else if (otpStep === "newPassword") {
          await resetPasswordWithOTP();
          return;
        }
      } else if (mode === "unlock") {
        const result = await unlock(password);
        if (result.success) {
          clearPasswordFields();
          onClose(true); // Pass true for successful operation
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
        onClose(true); // Pass true for successful operation
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
    onClose(true); // Pass true for successful operation
  };

  const handleClose = () => {
    clearPasswordFields();
    onClose(false); // Pass false for user cancellation
  };

  if (!isOpen) return null;

  const getModalTitle = () => {
    if (mode === "change") {
      switch (otpStep) {
        case "email": return "Verify Email for Password Reset";
        case "otp": return "Enter Verification Code";
        case "newPassword": return "Set New Password";
        default: return "Change Password";
      }
    }
    
    switch (mode) {
      case "set": return "Set Lock Password";
      case "change": return "Change Password";
      case "unlock": return "Unlock Application";
      default: return "Lock Settings";
    }
  };

  const getModalIcon = () => {
    if (mode === "change") {
      switch (otpStep) {
        case "email": return <FiMail size={24} />;
        case "otp": return <FiKey size={24} />;
        case "newPassword": return <FiLock size={24} />;
        default: return <FiLock size={24} />;
      }
    }
    
    switch (mode) {
      case "set": return <FiLock size={24} />;
      case "change": return <FiLock size={24} />;
      case "unlock": return <FiUnlock size={24} />;
      default: return <FiLock size={24} />;
    }
  };

  return (
    <div className="fixed inset-0 modal-backdrop backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-16">

      <div className="bg-card-bg rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto border border-border">
        <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">

            {/* --Lock Icon-- */}
            <div className="text-primary">
              {getModalIcon()}
            </div>

            {/* --Lock Icon-- */}
            <h2 className="text-xl font-semibold text-text-primary">
              {getModalTitle()}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-text hover:text-foreground transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {showSetupInstructions && (
          <div className="mb-6 p-4 bg-bg-tertiary/60 border border-border rounded-lg">
            <div className="flex items-start gap-3">
              <FiInfo className="text-primary mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-medium text-text-primary mb-2">Database Setup Required</h3>
                <p className="text-text-secondary text-sm mb-3">
                  The lock feature requires a database table to be created first.
                </p>
                <div className="text-xs text-text-secondary bg-bg-secondary p-3 rounded border border-border">
                  <strong>Quick Setup:</strong><br/>
                  1. Go to Supabase Dashboard → SQL Editor<br/>
                  2. Run the SQL from <code className="bg-bg-tertiary px-1 rounded">setup_lock_table.sql</code><br/>
                  3. Refresh this page and try again
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OTP Instructions */}
        {mode === "change" && (
          <OTPInstructions email={email} step={otpStep} />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* OTP Flow for Password Change */}
          {mode === "change" && otpStep === "email" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full input-writing"
                  placeholder="Enter your email address"
                  required
                  disabled={!!user?.email}
                />
                {user?.email && (
                  <p className="text-xs text-text-secondary mt-1">
                    Using your account email: {user.email}
                  </p>
                )}
              </div>
            </div>
          )}

          {mode === "change" && otpStep === "otp" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full input-writing text-center text-lg tracking-widest"
                  placeholder="000000"
                  required
                  maxLength={6}
                />
                <p className="text-xs text-text-secondary mt-1">
                  Enter the 6-digit code sent to {email}
                </p>
                
                {/* Development Mode OTP Display */}
                {process.env.NODE_ENV === 'development' && devOtp && (
                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                    <strong>Development Mode:</strong> OTP is {devOtp}
                  </div>
                )}
                
                {resendCooldown > 0 ? (
                  <p className="text-xs text-muted-text mt-1">
                    Resend code in {resendCooldown}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={sendOTP}
                    className="text-xs text-primary hover:text-primary-dark mt-1 underline"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </div>
          )}

          {mode === "change" && otpStep === "newPassword" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full input-writing pr-10"
                    placeholder="Enter new password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-text hover:text-foreground"
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full input-writing pr-10"
                    placeholder="Confirm new password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-text hover:text-foreground"
                  >
                    {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === "set" && (
            <div className="space-y-4">
              {/* -- Set Password Input -- */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full input-writing pr-10"
                    placeholder="Enter password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-text hover:text-foreground"
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

             {/* -- Set Confirm Password Input -- */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full input-writing pr-10"
                    placeholder="Confirm password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-text hover:text-foreground"
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
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                />
                <label htmlFor="lockJournal" className="text-sm text-text-secondary">
                  Also lock Journal entries
                </label>
              </div>
            </div>
          )}

          {mode === "change" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full input-writing pr-10"
                    placeholder="Enter new password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-text hover:text-foreground"
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full input-writing pr-10"
                    placeholder="Confirm new password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-text hover:text-foreground"
                  >
                    {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === "unlock" && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full input-writing pr-10"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />

                {/* -- Hide/Show Password - Eye toggle button -- */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-text hover:text-foreground"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="text-danger text-sm bg-danger/10 p-3 rounded-md border border-danger/20">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {mode === "set" && (
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-writing disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Setting..." : "Set Password"}
              </button>
            )}

            {/* OTP Flow Buttons for Password Change */}
            {mode === "change" && otpStep === "email" && (
              <button
                type="submit"
                disabled={isLoading || !email}
                className="flex-1 btn-writing disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Send Verification Code"}
              </button>
            )}

            {mode === "change" && otpStep === "otp" && (
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="flex-1 btn-writing disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>
            )}

            {mode === "change" && otpStep === "newPassword" && (
              <button
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className="flex-1 btn-writing disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            )}

            {/* -- Unlock Button -- */}
            {mode === "unlock" && (
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-writing disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Unlocking..." : "Unlock"}
              </button>
            )}

            {/* Back Button for OTP Flow */}
            {mode === "change" && otpStep !== "email" && (
              <button
                type="button"
                onClick={() => {
                  if (otpStep === "otp") {
                    setOtpStep("email");
                    setOtp("");
                  } else if (otpStep === "newPassword") {
                    setOtpStep("otp");
                    setPassword("");
                    setConfirmPassword("");
                  }
                }}
                className="flex-1 bg-bg-tertiary text-text-secondary py-2 px-4 rounded-md hover:bg-border/30 transition-colors border border-border"
              >
                Back
              </button>
            )}

            {/* -- Cancel Button -- */}
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-bg-tertiary text-text-secondary py-2 px-4 rounded-md hover:bg-border/30 transition-colors border border-border"
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