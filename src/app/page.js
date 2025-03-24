"use client";

import { useState, useEffect } from "react";
import EntryTypeCard from "./components/EntryTypeCard";
import HeroSection from "./components/HeroSection";
import RecentEntriesSection from "./components/RecentEntriesSection";
import ToggleSwitch from "./components/ToggleSwitch";
import FloatingActionButton from "./components/FloatingActionButton";
import CreateFirstEntryDialog from "./components/CreateFirstEntryDialog";
import { useAuth } from "../context/AuthContext";
import databaseUtils from "../lib/database";
import { FiMessageSquare } from "react-icons/fi";
import emailjs from '@emailjs/browser';

export default function Home() {
  const [viewMode, setViewMode] = useState(1);
  const [entryCounts, setEntryCounts] = useState({
    journal: 0,
    diary: 0,
    stories: 0,
    songs: 0,
    quotes: 0
  });
  const [anyEntryExists, setAnyEntryExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Feedback state
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  
  useEffect(() => {
    async function loadEntryCounts() {
      setLoading(true);
      
      try {
        let counts = {
          journal: 0,
          diary: 0,
          stories: 0,
          songs: 0,
          quotes: 0
        };
        
        // If user is logged in, get counts from Supabase
        if (user) {
          // Get journal entries
          const journalEntries = await databaseUtils.getJournalEntries(user.id);
          counts.journal = journalEntries.length;
          
          // Get diary entries
          const diaryEntries = await databaseUtils.getDiaryEntries(user.id);
          counts.diary = diaryEntries.length;
        } 
        // Otherwise fall back to localStorage
        else if (typeof window !== "undefined") {
          // Get counts from localStorage
          const journalEntries = JSON.parse(localStorage.getItem("journalEntries") || "[]");
          const diaryEntries = JSON.parse(localStorage.getItem("diaryEntries") || "[]");
          const storyEntries = JSON.parse(localStorage.getItem("storyEntries") || "[]");
          const songEntries = JSON.parse(localStorage.getItem("poemEntries") || "[]");
          const quoteEntries = JSON.parse(localStorage.getItem("quoteEntries") || "[]");
          
          // Update entry counts
          counts = {
            journal: journalEntries.length,
            diary: diaryEntries.length,
            stories: storyEntries.length,
            songs: songEntries.length,
            quotes: quoteEntries.length
          };
        }
        
        setEntryCounts(counts);
        
        // Check if any entries exist
        const hasAnyEntry = Object.values(counts).some(count => count > 0);
        setAnyEntryExists(hasAnyEntry);
      } catch (error) {
        console.error("Error loading entry counts:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadEntryCounts();
  }, [user]);
  
  const entryTypes = [
    {
      title: "Journals",
      icon: "📒",
      description: "Write detailed journal entries with rich formatting",
      path: "/journal",
      bgColor: "bg-green-50",
      entryCount: entryCounts.journal
    },
    {
      title: "Diaries",
      icon: "📓",
      description: "Record your daily thoughts and experiences",
      path: "/diary",
      bgColor: "bg-blue-50",
      entryCount: entryCounts.diary
    },
    {
      title: "Original Stories",
      icon: "✍️",
      description: "Create and save your original stories",
      path: "/stories",
      bgColor: "bg-yellow-50",
      entryCount: entryCounts.stories
    },
    {
      title: "Songs/Poems",
      icon: "🎵",
      description: "Express yourself through songs and poetry",
      path: "/songs",
      bgColor: "bg-purple-50",
      entryCount: entryCounts.songs
    },
    {
      title: "Quotes/Thoughts",
      icon: "💬",
      description: "Save inspiring quotes and thoughts",
      path: "/quotes",
      bgColor: "bg-pink-50",
      entryCount: entryCounts.quotes
    }
  ];

  // Filter entry types with entries
  const activeEntryTypes = entryTypes.filter(type => type.entryCount > 0);

  // Handle feedback submission
  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setSendingFeedback(true);
    setFeedbackError("");
    
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
    emailjs.send(serviceId, templateId, templateParams, publicKey)
      .then((result) => {
        console.log('Email sent successfully:', result.text);
        setSubmitted(true);
        setSendingFeedback(false);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setFeedback("");
          setSubmitted(false);
        }, 3000);
      }, (error) => {
        console.error('Failed to send email:', error.text);
        setFeedbackError("Failed to send feedback. Please try again later.");
        setSendingFeedback(false);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <main className="max-w-7xl mx-auto pt-24 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
              <div className="w-4 h-4 rounded-full bg-primary animate-pulse delay-150"></div>
              <div className="w-4 h-4 rounded-full bg-primary animate-pulse delay-300"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Toggle Switch */}
      <div id="content-section">
        <ToggleSwitch 
          option1="Recent Entries" 
          option2="Browse Categories" 
          onChange={setViewMode}
        />
      
        {/* Content Section (toggleable) */}
        {viewMode === 1 ? (
          <RecentEntriesSection />
        ) : (
          <div className="py-12">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <h2 className="text-2xl font-bold mb-8 text-center md:text-left">Browse Categories</h2>
              
              {activeEntryTypes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {entryTypes.map((type) => (
                    <EntryTypeCard
                      key={type.title}
                      title={type.title}
                      icon={type.icon}
                      description={type.description}
                      path={type.path}
                      bgColor={type.bgColor}
                      entryCount={type.entryCount}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center py-16">
                  <div className="text-center max-w-md mx-auto">
                    <div className="flex justify-center mb-6">
                      <CreateFirstEntryDialog />
                    </div>
              <p className="text-gray-400">You don&apos;t have any entries yet. Create your first one to get started!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
{/* Feedback Section */}
<section className="py-12 bg-gray-900/50">

  <div className="max-w-5xl mx-auto px-4 flex justify-between items-start gap-8">
  <img 
      src="book.png" 
      alt="Feedback" 
      className="w-48 h-48 object-cover rounded-lg  opacity-70"
    />

    {/* Feedback Form */}
    <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <FiMessageSquare size={20} className="text-primary" />
        <h2 className="text-xl font-bold">Feedback & Suggestions</h2>
      </div>

      {submitted ? (
        <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 text-green-400">
          <p className="font-medium">Thank you for your feedback!</p>
          <p className="text-sm mt-1">Your message has been sent successfully.</p>
        </div>
      ) : (
        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <textarea
            id="feedback"
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your suggestions..."
            className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            required
          />

          {feedbackError && (
            <div className="text-red-500 text-sm">{feedbackError}</div>
          )}
        </form>
      )}
    </div>

    {/* Info Section */}
    <div className="w-1/3 text-gray-300 flex flex-col justify-between h-full">
      <div>
        <p className="text-lg font-medium mb-2">Help us improve Unseen Stories!</p>
        <p className="text-sm leading-relaxed">
          We value your thoughts and suggestions. Found an issue or have a feature request? Let us know!
        </p>
      </div>

      {/* Button and Sending Info */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={sendingFeedback}
          onClick={handleFeedbackSubmit}
          className="bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded transition-colors disabled:opacity-70 w-full"
        >
          {sendingFeedback ? "Sending..." : "Send Feedback"}
        </button>

        {user && (
          <div className="text-sm text-gray-500 mt-2">
            Sending as: {user.email || user.user_metadata?.name || "Logged in user"}
          </div>
        )}
      </div>
    </div>

  </div>
</section>



    
      
      {/* Only show floating action button if user is logged in */}
      {user && <FloatingActionButton />}
    </div>
  );
}
