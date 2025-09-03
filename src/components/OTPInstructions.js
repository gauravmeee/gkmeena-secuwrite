"use client";

import { FiMail, FiClock, FiShield, FiCheckCircle } from "react-icons/fi";

export default function OTPInstructions({ email, step }) {
  if (step === "email") {
    return (
      <div className="mb-6 p-4 bg-bg-tertiary/60 border border-border rounded-lg flex items-start">
            <div className="text-xs text-text-secondary space-y-1">
              <div className="flex items-center gap-2">
                <FiShield size={12} />
                <span>Protects against unauthorized password changes</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckCircle size={12} />
                <span>Only you can reset your password</span>
              </div>
            </div>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="mb-6 p-4 bg-bg-tertiary/60 border border-border rounded-lg">
        <div className="flex items-start gap-3">
          <FiMail className="text-primary mt-1 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-medium text-text-primary mb-2">Check Your Email</h3>
            <p className="text-text-secondary text-sm mb-3">
              We&apos;ve sent a 6-digit verification code to <strong>{email}</strong>
            </p>
            <div className="text-xs text-text-secondary space-y-1">
              <div className="flex items-center gap-2">
                <FiClock size={12} />
                <span>Code expires in 10 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <FiShield size={12} />
                <span>Enter the code exactly as shown</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "newPassword") {
    return (
      <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg">
        <div className="flex items-start gap-3">
          <FiCheckCircle className="text-success mt-1 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-medium text-success mb-2">Email Verified Successfully</h3>
            <p className="text-text-secondary text-sm">
              You can now set your new password. Make sure to choose a strong password that you&apos;ll remember.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
