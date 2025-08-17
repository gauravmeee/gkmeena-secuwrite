import { useState } from "react";
import { FiMessageSquare, FiChevronUp, FiChevronDown } from "react-icons/fi";
import emailjs from '@emailjs/browser';
import { useAuth } from "../../context/AuthContext";

export default function FeedbackSection() {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
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
      setTimeout(() => {
        setSubmitStatus(null);
        setIsExpanded(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to send feedback:', error);
      setError("Failed to send feedback. Please try again later.");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card-bg/50 border-t border-border/30">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiMessageSquare size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Feedback & Suggestions</h2>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-muted-text hover:text-foreground transition-colors text-sm"
            >
              {isExpanded ? (
                <>
                  <span>Hide</span>
                  <FiChevronUp size={16} />
                </>
              ) : (
                <>
                  <span>Show</span>
                  <FiChevronDown size={16} />
                </>
              )}
            </button>
          </div>

          {isExpanded && (
            <>
              {submitStatus === "success" ? (
                <div className="bg-success-light border border-success/20 rounded-lg p-3 text-success">
                  <p className="font-medium text-sm">Thank you for your feedback!</p>
                  <p className="text-xs mt-1">Your message has been sent successfully.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share your suggestions..."
                    className="w-full bg-paper-bg border border-border-light rounded-lg p-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                    required
                    maxLength={300}
                    rows={3}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-xs text-muted-text">
                      {feedback.length}/300 characters
                    </p>
                    {error && (
                      <p className="text-xs text-danger">
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting || !feedback.trim()}
                      className="btn-writing disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        "Send Feedback"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 