"use client";

import { useState, useEffect, useMemo } from "react";
import HeroSection from "./components/HeroSection";
import EntriesSection from "./components/EntriesSection";

import FloatingActionButton from "./components/FloatingActionButton";
import CreateFirstEntryDialog from "./components/CreateFirstEntryDialog";
import { useAuth } from "../context/AuthContext";
import databaseUtils from "../lib/database";
import { FiBook, FiEdit } from "react-icons/fi";
import emailjs from '@emailjs/browser';

import { LazyEncryptionMigration } from "../utils/componentUtils";
import { SimpleCache, debounce } from "../utils/componentUtils";

// Optimized cache for entry counts
const countCache = new SimpleCache(5 * 60 * 1000); // 5 minutes

export default function Home() {
  const [entryCounts, setEntryCounts] = useState({
    journal: 0,
    diary: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, toggleAuthModal } = useAuth();
  
  // Feedback state
  const [feedback, setFeedback] = useState("");


  
  // Memoize the entry types to prevent unnecessary re-renders
  const entryTypes = useMemo(() => [
    {
      title: "Journal",
      description: "Write your thoughts with rich text formatting",
      count: entryCounts.journal,
      link: "/journal/new",
      type: "journal"
    },
    {
      title: "Diary",
      description: "Record your daily experiences",
      count: entryCounts.diary,
      link: "/diary/new",
      type: "diary"
    }
  ], [entryCounts.journal, entryCounts.diary]);

  // Debounced feedback submission
  const debouncedFeedbackSubmit = useMemo(
    () => debounce(async (feedbackText) => {
      if (!feedbackText.trim()) return;
      
      setSendingFeedback(true);
      setFeedbackError("");
      
      try {
        const userIdentifier = user ? (user.email || user.user_metadata?.name || user.id || "Anonymous") : "Anonymous";
        
        const templateParams = {
          message: feedbackText,
          from_name: userIdentifier,
          user_info: user ? `User ID: ${user.id}` : "Not logged in"
        };
        
        const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
        const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
        const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
        
        await emailjs.send(serviceId, templateId, templateParams, publicKey);
        
        setSubmitted(true);
        setFeedback("");
        setTimeout(() => setSubmitted(false), 3000);
      } catch (error) {
        console.error('Failed to send feedback:', error);
        setFeedbackError("Failed to send feedback. Please try again later.");
      } finally {
        setSendingFeedback(false);
      }
    }, 300),
    [user]
  );

  useEffect(() => {
    async function loadEntryCounts() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        // Check cache first
        const cacheKey = `entryCounts_${user.id}`;
        const cachedCounts = countCache.get(cacheKey);
        
        if (cachedCounts) {
          setEntryCounts(cachedCounts);
          setLoading(false);
          return;
        }

        // Get counts in parallel for better performance
        const [journalEntries, diaryEntries] = await Promise.all([
          databaseUtils.getJournalEntries(user.id),
          databaseUtils.getDiaryEntries(user.id)
        ]);

        const counts = {
          journal: journalEntries.length,
          diary: diaryEntries.length,
        };

        // Cache the results
        countCache.set(cacheKey, counts);
        setEntryCounts(counts);
      } catch (error) {
        console.error('Error loading entry counts:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEntryCounts();
  }, [user]);

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    debouncedFeedbackSubmit(feedback);
  };

  // Define ContentSection component inside Home
  const ContentSection = () => {
    // Check for user first
    if (!user) {
      return (
        <div className="h-screen min-h-screen flex justify-center items-center">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiBook className="text-white text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-3">Start Your Writing Journey</h2>
            <p className="text-muted-text text-sm mb-4">
              Sign in to create and manage your personal entries securely
            </p>
            <button
              onClick={toggleAuthModal}
              className="btn-writing"
            >
              Sign in to get started
            </button>
          </div>
        </div>
      );
    }

    // Check for any entries
    const hasAnyEntries = Object.values(entryCounts).some(count => count > 0);
    if (!hasAnyEntries) {
      return (
        <div className="h-screen min-h-screen flex justify-center items-center">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiEdit className="text-white text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-3">Create Your First Entry</h2>
            <p className="text-muted-text text-sm mb-4">
              You don't have any entries yet. Create your first one to get started!
            </p>
            <div className="flex justify-center">
              <CreateFirstEntryDialog />
            </div>
          </div>
        </div>
      );
    }

    // If we have entries, show the content
    return (
      <EntriesSection viewMode={1} entryTypes={entryTypes} />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
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
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Main Content Section */}
      <div id="content-section" className="relative">
        {/* Content Section Component */}
        <ContentSection />
      </div>
      
      {/* Floating Action Button */}
      {user && <FloatingActionButton />}
      
      {/* Lazy load encryption migration */}
      {user && <LazyEncryptionMigration userId={user.id} />}
    </div>
  );
}
