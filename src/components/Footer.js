"use client";
import { useState } from "react";
import Link from "next/link";
import { FiMessageSquare, FiX } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import emailjs from '@emailjs/browser';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [error, setError] = useState("");
  
  const handleFeedback = () => {
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setError("");

    try {
      const userIdentifier = user ? (user.email || user.user_metadata?.name || user.id || "Anonymous") : "Anonymous";
      
      const templateParams = {
        message: feedback,
        from_name: userIdentifier,
        user_info: user ? `User ID: ${user.id}` : "Not logged in"
      };
      
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
      
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      
      setSubmitStatus("success");
      setFeedback("");
      setTimeout(() => {
        setShowFeedbackModal(false);
        setSubmitStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to send feedback:', error);
      setError("Failed to send feedback. Please try again later.");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <footer className="bg-card-bg/90 backdrop-blur-sm text-muted-text py-4 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Unseen Stories</span>
              <span className="text-xs mx-2">|</span>
              <span className="text-xs">© {currentYear}</span>
            </div>
            
            {/* Links */}
            <div className="flex items-center gap-4">
              <Link href="/about" className="text-xs hover:text-primary transition-colors">About</Link>
              <Link href="/privacy" className="text-xs hover:text-primary transition-colors">Privacy</Link>
              <button
                onClick={handleFeedback}
                className="text-xs hover:text-primary transition-colors flex items-center gap-1"
              >
                <FiMessageSquare size={12} />
                <span>Feedback</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card-bg rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Send Feedback</h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-muted-text hover:text-foreground transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {submitStatus === "success" ? (
              <div className="text-center py-4">
                <div className="text-success text-lg mb-2">✓</div>
                <p className="text-foreground">Thank you for your feedback!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your suggestions..."
                  className="w-full bg-paper-bg border border-border-light rounded-lg p-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                  required
                  maxLength={300}
                  rows={4}
                />

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-text">
                    {feedback.length}/300 characters
                  </p>
                  {error && (
                    <p className="text-xs text-danger">
                      {error}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="flex-1 px-4 py-2 bg-border/30 text-foreground rounded-lg hover:bg-border/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !feedback.trim()}
                    className="flex-1 btn-writing disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Sending..." : "Send Feedback"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
