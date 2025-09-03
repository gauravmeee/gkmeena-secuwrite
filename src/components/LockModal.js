"use client";

import { useState, useEffect } from "react";
import { FiLock, FiUnlock, FiEye, FiEyeOff, FiX, FiInfo, FiMail, FiKey } from "react-icons/fi";
import { useLock } from "../context/LockContext";
import { useAuth } from "../context/AuthContext";
import OTPInstructions from "./OTPInstructions";
import emailjs from '@emailjs/browser';
import { supabase } from '../lib/supabase';

export default function LockModal({ isOpen, onClose, mode = "unlock" }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [switchToOTP, setSwitchToOTP] = useState(false);
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
  const [emailSentSuccessfully, setEmailSentSuccessfully] = useState(false);
  
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
      setEmailSentSuccessfully(false);
      
      // Set email from user if available
      if (user?.email) {
        setEmail(user.email);
      }
    }
  }, [isOpen, mode, user]);

  const clearPasswordFields = () => {
    setPassword("");
    setConfirmPassword("");
    setNewPassword("");
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowNewPassword(false);
    setSwitchToOTP(false);
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
      // First, get OTP from server
      const response = await fetch('/api/otp/send-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        // Now send email using client-side EmailJS
        try {
          console.log('EmailJS Config from server:', result.emailConfig);
          
          const templateParams = {
            to_email: email,
            otp_code: result.otp,
            app_name: 'Secuwrite',
            expiry_minutes: 10
          };

          console.log('Sending EmailJS request with params:', {
            serviceId: result.emailConfig.serviceId,
            templateId: result.emailConfig.templateId,
            templateParams: { ...templateParams, otp_code: '***' },
            publicKey: result.emailConfig.publicKey ? 'Set' : 'Missing'
          });

          await emailjs.send(
            result.emailConfig.serviceId,
            result.emailConfig.templateId,
            templateParams,
            result.emailConfig.publicKey
          );

          console.log(`OTP sent to ${email}: ${result.otp}`);
          
          setOtpSent(true);
          setOtpStep("otp");
          setError("");
          setEmailSentSuccessfully(true);
          
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
          
        } catch (emailError) {
          console.error('EmailJS Error:', emailError);
          console.error('EmailJS Error Details:', {
            message: emailError.message,
            status: emailError.status,
            text: emailError.text
          });
          
          // For development, still proceed with OTP even if email fails
          if (process.env.NODE_ENV === 'development') {
            setOtpSent(true);
            setOtpStep("otp");
            setError(`Email failed: ${emailError.message}. Using development OTP: ${result.otp}`);
            setDevOtp(result.otp);
            setEmailSentSuccessfully(false);
            
            // Start cooldown timer
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
          } else {
            setError(`Failed to send email: ${emailError.message}`);
          }
        }
      } else {
        setError(result.error || 'Failed to generate OTP');
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
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 4) {
      setError("New password must be at least 4 characters");
      return;
    }

    if (!email || !otp || !newPassword || !user?.id) {
      setError("Email, OTP, new password, and user ID are required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      

      
      if (!session?.access_token) {
        setError('No valid session found. Please log in again.');
        return;
      }
      
      const response = await fetch('/api/otp/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          email, 
          otp, 
          newPassword: newPassword,
          userId: user.id 
        }),
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
      } else if (mode === "change" || switchToOTP) {
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
      } else if (mode === "changeSimple") {
        // Simple password change with current password verification
        if (newPassword !== confirmPassword) {
          setError("New passwords do not match");
          return;
        }
        if (newPassword.length < 4) {
          setError("New password must be at least 4 characters");
          return;
        }
        
        // First verify current password by trying to unlock
        const unlockResult = await unlock(password);
        if (!unlockResult.success) {
          setError("Current password is incorrect");
          setPassword(""); // Clear current password field
          return;
        }
        
        // If current password is correct, set the new password
        const result = await setGlobalPassword(newPassword, lockJournal);
        if (result.success) {
          clearPasswordFields();
          onClose(true); // Pass true for successful operation
        } else {
          setError(result.error);
        }
      } else if (mode === "remove") {
        // Remove lock with password verification
        // First verify current password by trying to unlock
        const unlockResult = await unlock(password);
        if (!unlockResult.success) {
          setError("Current password is incorrect");
          setPassword(""); // Clear password field
          return;
        }
        
        // If current password is correct, remove the lock
        const result = await removePassword();
        if (result.success) {
          clearPasswordFields();
          onClose(true); // Pass true for successful operation
        } else {
          setError(result.error);
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
    if (mode === "change" || switchToOTP) {
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
      case "changeSimple": return "Change Password";
      case "unlock": return "Unlock Application";
      case "remove": return "Remove Lock";
      default: return "Lock Settings";
    }
  };

  const getModalIcon = () => {
    if (mode === "change" || switchToOTP) {
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
      case "changeSimple": return <FiLock size={24} />;
      case "unlock": return <FiUnlock size={24} />;
      case "remove": return <FiX size={24} />;
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
        {(mode === "change" || switchToOTP) && (
          <OTPInstructions email={email} step={otpStep} />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* OTP Flow for Password Change */}
          {(mode === "change" || switchToOTP) && otpStep === "email" && (
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

          {(mode === "change" || switchToOTP) && otpStep === "otp" && (
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
                    <br />
                    {emailSentSuccessfully ? (
                      <small className="text-green-600">✅ Email sent successfully!</small>
                    ) : (
                      <small className="text-red-600">Note: Email sending failed, using development OTP for testing</small>
                    )}
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

          {(mode === "change" || switchToOTP) && otpStep === "newPassword" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full input-writing pr-10"
                    placeholder="Enter new password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-text hover:text-foreground"
                  >
                    {showNewPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
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



          {mode === "unlock" && !switchToOTP && (
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
              
              {/* Reset Password Link */}
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setSwitchToOTP(true);
                    setOtpStep("email");
                    setEmail(user?.email || "");
                    setPassword("");
                    setConfirmPassword("");
                    setOtp("");
                    setError("");
                  }}
                  className="text-xs text-primary hover:text-primary-dark underline"
                >
                  Reset Password
                </button>
              </div>
            </div>
          )}

          {mode === "changeSimple" && (
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full input-writing pr-10"
                    placeholder="Enter current password"
                    required
                    autoComplete="current-password"
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

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full input-writing pr-10"
                    placeholder="Enter new password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-text hover:text-foreground"
                  >
                    {showNewPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
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

          {mode === "remove" && (
            <div>
              <div className="mb-4 p-4 bg-danger/10 border border-danger/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <FiX className="text-danger mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-medium text-danger mb-2">Remove Lock Protection</h3>
                    <p className="text-text-secondary text-sm">
                      This will permanently remove the lock protection from your entries. 
                      You will need to verify your current password to proceed.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full input-writing pr-10"
                    placeholder="Enter current password to confirm"
                    required
                    autoComplete="current-password"
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
            {(mode === "change" || switchToOTP) && otpStep === "email" && (
              <button
                type="submit"
                disabled={isLoading || !email}
                className="flex-1 btn-writing disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Send Verification Code"}
              </button>
            )}

            {(mode === "change" || switchToOTP) && otpStep === "otp" && (
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="flex-1 btn-writing disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>
            )}

            {(mode === "change" || switchToOTP) && otpStep === "newPassword" && (
              <button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="flex-1 btn-writing disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            )}

            {/* -- Unlock Button -- */}
            {mode === "unlock" && !switchToOTP && (
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-writing disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Unlocking..." : "Unlock"}
              </button>
            )}

            {/* -- Change Simple Button -- */}
            {mode === "changeSimple" && (
              <button
                type="submit"
                disabled={isLoading || !password || !newPassword || !confirmPassword}
                className="flex-1 btn-writing disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Changing..." : "Change Password"}
              </button>
            )}

            {/* -- Remove Lock Button -- */}
            {mode === "remove" && (
              <button
                type="submit"
                disabled={isLoading || !password}
                className="flex-1 bg-danger text-white py-2 px-4 rounded-md hover:bg-danger-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Removing..." : "Remove Lock"}
              </button>
            )}

            {/* Back Button for OTP Flow */}
            {(mode === "change" || switchToOTP) && otpStep !== "email" && (
              <button
                type="button"
                onClick={() => {
                  if (otpStep === "otp") {
                    setOtpStep("email");
                    setOtp("");
                  } else if (otpStep === "newPassword") {
                    setOtpStep("otp");
                    setNewPassword("");
                    setConfirmPassword("");
                  }
                  // If we're in switchToOTP mode and going back to email step, reset switchToOTP
                  if (switchToOTP && otpStep === "otp") {
                    setSwitchToOTP(false);
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