import { useState } from "react";
import { FiMessageSquare } from "react-icons/fi";
import emailjs from '@emailjs/browser';
import { useAuth } from "../../context/AuthContext";

export default function FeedbackSection() {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setError("");

    try {
      // Get user information
      const userIdentifier = user ? (user.email || user.user_metadata?.name || user.id || "Anonymous") : "Anonymous";
      
      // Prepare template parameters
      const templateParams = {
        message: feedback,
        from_name: userIdentifier,
        user_info: user ? `User ID: ${user.id}` : "Not logged in"
      };
      
      // Get EmailJS credentials from environment variables
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
      
      // Send the email using EmailJS
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      
      setSubmitStatus("success");
      setFeedback("");
    } catch (error) {
      console.error('Failed to send feedback:', error);
      setError("Failed to send feedback. Please try again later.");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-900/50 border-t border-gray-800">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-8 sm:py-16">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <FiMessageSquare size={20} className="text-primary sm:text-2xl" />
            <h2 className="text-xl sm:text-2xl font-bold">Feedback & Suggestions</h2>
          </div>

          {submitStatus === "success" ? (
            <div className="bg-green-900/30 border border-green-800 rounded-lg p-3 sm:p-4 text-green-400">
              <p className="font-medium text-sm sm:text-base">Thank you for your feedback!</p>
              <p className="text-xs sm:text-sm mt-1">Your message has been sent successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your suggestions..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                required
                maxLength={500}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs sm:text-sm text-gray-500">
                  {feedback.length}/500 characters
                </p>
                {error && (
                  <p className="text-xs sm:text-sm text-red-400">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !feedback.trim()}
                  className="bg-primary hover:bg-primary/90 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    "Send Feedback"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 