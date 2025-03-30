"use client";

import { useState, useEffect } from "react";
import EntryTypeCard from "./components/EntryTypeCard";
import HeroSection from "./components/HeroSection";
import EntriesSection from "./components/EntriesSection";
import ToggleSwitch from "./components/ToggleSwitch";
import FloatingActionButton from "./components/FloatingActionButton";
import CreateFirstEntryDialog from "./components/CreateFirstEntryDialog";
import { useAuth } from "../context/AuthContext";
import databaseUtils from "../lib/database";
import { FiMessageSquare, FiChevronRight } from "react-icons/fi";
import emailjs from '@emailjs/browser';
import Link from "next/link";
import FeedbackSection from "./components/FeedbackSection";

export default function Home() {
  const [viewMode, setViewMode] = useState(1);
  const [entryCounts, setEntryCounts] = useState({
    journal: 0,
    diary: 0,
    stories: 0,
    songs: 0,
    quotes: 0
  });
  const [loading, setLoading] = useState(true);
  const { user, toggleAuthModal } = useAuth();
  
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
      } catch (error) {
        console.error("Error loading entry counts:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadEntryCounts();
  }, [user]);
  
  // Define entryTypes
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

  // Define ContentSection component inside Home
  const ContentSection = () => {
    // Check for user first
    if (!user) {
      return (
        <div className="flex justify-center items-center py-8 sm:py-16">
          <div className="text-center max-w-md mx-auto">
            <button
              onClick={toggleAuthModal}
              className="text-primary hover:text-primary/90 text-base sm:text-lg font-medium transition-colors"
            >
              Sign in to view your entries
            </button>
            <p className="text-gray-400 text-xs sm:text-sm mt-2 sm:mt-4">
              Create and manage your personal entries securely
            </p>
          </div>
        </div>
      );
    }

    // Check for any entries
    const hasAnyEntries = Object.values(entryCounts).some(count => count > 0);
    if (!hasAnyEntries) {
      return (
        <div className="flex justify-center items-center py-8 sm:py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="flex justify-center mb-4 sm:mb-6">
              <CreateFirstEntryDialog />
            </div>
            <p className="text-gray-400 text-sm sm:text-base">
              You don&apos;t have any entries yet. Create your first one to get started!
            </p>
          </div>
        </div>
      );
    }

    // If we have entries, show the content
    return (
      <div className="py-6 sm:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 sm:mb-8 gap-2 sm:gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
                {viewMode === 1 ? "Recent Entries" : "Category-wise Entries"}
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm">
                {viewMode === 1 
                  ? "Your latest thoughts and experiences" 
                  : "Browse your entries by category"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <Link 
                href="/journal" 
                className="text-primary hover:text-primary/90 flex items-center gap-1 transition-colors group text-xs sm:text-sm"
              >
                <span>View all journals</span>
                <FiChevronRight size={12} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link 
                href="/diary" 
                className="text-primary hover:text-primary/90 flex items-center gap-1 transition-colors group text-xs sm:text-sm"
              >
                <span>View all diaries</span>
                <FiChevronRight size={12} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <EntriesSection viewMode={viewMode} entryTypes={entryTypes} />
        </div>
      </div>
    );
  };

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
      
      {/* Main Content Section */}
      <div id="content-section" className="relative">
        {/* Toggle Switch with improved positioning and styling */}
        <div className="sticky top-20 z-20 bg-black/80 backdrop-blur-sm py-1 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
            <ToggleSwitch 
              option1="Recent Entries" 
              option2="Categories" 
              onChange={setViewMode}
            />
          </div>
        </div>
        
        {/* Content Section Component */}
        <ContentSection />
      </div>
      
      {/* Feedback Section with improved styling */}
      <section className="mt-16">
        <FeedbackSection />
      </section>
      
      {/* Floating Action Button */}
      {user && <FloatingActionButton />}
    </div>
  );
}
