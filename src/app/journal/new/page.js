"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";
import databaseUtils from "../../../lib/database";
import { LazyJoditEditor, debounce } from "../../../utils/componentUtils";

function NewJournalEntryContent() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const isTypingRef = useRef(false);
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const mounted = useRef(false);
  const editorRef = useRef(null);
  const draftTimerRef = useRef(null);

  // Debounced save function for better performance
  const debouncedSave = useRef(
    debounce(async (title, content) => {
      if (!user || !title.trim() || !content.trim()) return;
      
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .insert([
            {
              user_id: user.id,
              title: title.trim(),
              content: content,
              created_at: new Date().toISOString()
            }
          ])
          .select();

        if (error) throw error;

        if (data && data[0]) {
          // Clear any drafts for this session
          const drafts = JSON.parse(localStorage.getItem(`journal_drafts_${user.id}`) || '[]');
          const updatedDrafts = drafts.filter(d => !d.isCurrentlyEditing);
          localStorage.setItem(`journal_drafts_${user.id}`, JSON.stringify(updatedDrafts));
          
          // Navigate to the new entry
          router.push(`/journal/${data[0].id}`);
        }
      } catch (error) {
        console.error('Error saving journal entry:', error);
        alert('Failed to save entry. Please try again.');
      }
    }, 300)
  ).current;

  // Update authentication check
  useEffect(() => {
    // Wait a bit to ensure auth is initialized
    const timer = setTimeout(() => {
      setAuthChecked(true);
      if (!user) {
        router.push('/');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, router]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Load draft content when component mounts
  useEffect(() => {
    if (user) {
      const editDraftId = searchParams.get('editDraft');
      
      if (editDraftId) {
        // Editing a specific draft - clear any session flags first
        sessionStorage.removeItem(`journal_new_session_${user.id}`);
        
        const drafts = JSON.parse(localStorage.getItem(`journal_drafts_${user.id}`) || '[]');
        const currentDraft = drafts.find(d => d.timestamp === editDraftId);
        
        if (currentDraft) {
          setTitle(currentDraft.title || '');
          setContent(currentDraft.content || '');
          if (editorRef.current) {
            editorRef.current.value = currentDraft.content || '';
          }
          
          // Mark this draft as currently being edited
          const updatedDrafts = drafts.map(d => ({
            ...d,
            isCurrentlyEditing: d.timestamp === currentDraft.timestamp
          }));
          localStorage.setItem(`journal_drafts_${user.id}`, JSON.stringify(updatedDrafts));
        }
      } else {
        // Check if user is intentionally creating new or refreshing while writing
        const isIntentionallyNew = sessionStorage.getItem(`journal_new_session_${user.id}`);
        
        if (isIntentionallyNew === 'true') {
          // User intentionally clicked "New Entry" - start blank
          // Clear any currently editing flags
          const drafts = JSON.parse(localStorage.getItem(`journal_drafts_${user.id}`) || '[]');
          const updatedDrafts = drafts.map(d => ({ ...d, isCurrentlyEditing: false }));
          localStorage.setItem(`journal_drafts_${user.id}`, JSON.stringify(updatedDrafts));
          
          // Reset form to blank state
          setTitle('');
          setContent('');
          if (editorRef.current) {
            editorRef.current.value = '';
          }
          
          // Clear the session flag
          sessionStorage.removeItem(`journal_new_session_${user.id}`);
        } else {
          // Check if there's a draft that was being edited (for refresh scenarios)
          const drafts = JSON.parse(localStorage.getItem(`journal_drafts_${user.id}`) || '[]');
          const currentDraft = drafts.find(d => d.isCurrentlyEditing);
          
          if (currentDraft) {
            // Load the currently editing draft (for refresh scenarios)
            setTitle(currentDraft.title || '');
            setContent(currentDraft.content || '');
            if (editorRef.current) {
              editorRef.current.value = currentDraft.content || '';
            }
          }
        }
      }
    }
  }, [user, searchParams]);

  // Auto-save draft functionality
  const saveDraft = () => {
    if (!user || (!title.trim() && !content.trim())) return;
    
    const drafts = JSON.parse(localStorage.getItem(`journal_drafts_${user.id}`) || '[]');
    const timestamp = Date.now().toString();
    
    // Remove any currently editing drafts
    const filteredDrafts = drafts.filter(d => !d.isCurrentlyEditing);
    
    // Add new draft
    const newDraft = {
      title: title.trim(),
      content: content,
      timestamp: timestamp,
      isCurrentlyEditing: true,
      created_at: new Date().toISOString()
    };
    
    // Keep only the 5 most recent drafts
    const updatedDrafts = [newDraft, ...filteredDrafts].slice(0, 5);
    localStorage.setItem(`journal_drafts_${user.id}`, JSON.stringify(updatedDrafts));
  };

  // Debounced draft saving
  const debouncedSaveDraft = useRef(debounce(saveDraft, 1000)).current;

  useEffect(() => {
    if (title.trim() || content.trim()) {
      debouncedSaveDraft();
    }
  }, [title, content, debouncedSaveDraft]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please enter a title and content');
      return;
    }
    
    setLoading(true);
    await debouncedSave(title, content);
    setLoading(false);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
          <div className="w-4 h-4 rounded-full bg-primary animate-pulse delay-150"></div>
          <div className="w-4 h-4 rounded-full bg-primary animate-pulse delay-300"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/journal" 
            className="flex items-center gap-2 text-muted-text hover:text-foreground transition-colors"
          >
            <FiArrowLeft size={20} />
            <span>Back to Journal</span>
          </Link>
          
          <button
            onClick={handleSave}
            disabled={loading || !title.trim() || !content.trim()}
            className="btn-writing disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave size={16} />
            {loading ? 'Saving...' : 'Save Entry'}
          </button>
        </div>

        {/* Title Input */}
        <div className="mb-8">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter your journal title..."
            className="input-writing w-full text-lg font-medium"
          />
        </div>

        {/* Rich Text Editor */}
        <div className="bg-paper-bg border border-border-light rounded-lg overflow-hidden shadow-sm">
          <LazyJoditEditor
            ref={editorRef}
            value={content}
            config={{
              readonly: false,
              placeholder: "Start writing your journal entry...",
              toolbar: true,
              spellcheck: true,
              language: "en",
              theme: "default",
              height: 500,
              buttons: [
                'source', '|',
                'bold', 'italic', 'underline', 'strikethrough', '|',
                'font', 'fontsize', 'brush', 'paragraph', '|',
                'align', '|',
                'ul', 'ol', '|',
                'table', 'link', '|',
                'undo', 'redo', '|',
                'hr', 'eraser', 'copyformat', '|',
                'fullsize'
              ],
              buttonsMD: [
                'bold', 'italic', 'underline', '|',
                'ul', 'ol', '|',
                'font', 'fontsize', '|',
                'undo', 'redo', '|',
                'link', '|',
                'fullsize'
              ],
              buttonsSM: [
                'bold', 'italic', '|',
                'ul', 'ol', '|',
                'fontsize', '|',
                'undo', 'redo'
              ],
              buttonsXS: [
                'bold', '|',
                'ul', 'ol', '|',
                'undo', 'redo'
              ]
            }}
            onBlur={handleContentChange}
            onChange={handleContentChange}
          />
        </div>

        {/* Draft Info */}
        <div className="mt-6 p-4 bg-success-light border border-success/20 rounded-lg">
          <div className="flex items-center gap-2 text-success">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Auto-saving drafts...</span>
          </div>
          <p className="text-sm text-success/80 mt-1">
            Your entry is automatically saved as a draft. Click "Save Entry" to publish it.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NewJournalEntry() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
          <div className="w-4 h-4 rounded-full bg-primary animate-pulse delay-150"></div>
          <div className="w-4 h-4 rounded-full bg-primary animate-pulse delay-300"></div>
        </div>
      </div>
    }>
      <NewJournalEntryContent />
    </Suspense>
  );
}