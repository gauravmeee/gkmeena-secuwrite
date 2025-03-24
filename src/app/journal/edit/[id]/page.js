"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "../../../components/Navbar";
import { useRouter, useParams } from "next/navigation";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import dynamic from "next/dynamic";
import Footer from "../../../components/Footer";

// Move Draft.js imports inside useEffect to ensure they only run client-side
const Editor = dynamic(
  () => import('react-draft-wysiwyg').then(mod => mod.Editor),
  { 
    ssr: false,
    loading: () => (
      <div className="p-4 text-gray-500 flex justify-center items-center">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse"></div>
          <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-150"></div>
          <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-300"></div>
        </div>
      </div>
    )
  }
);

// Import the CSS files
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

export default function EditJournalEntry() {
  const [title, setTitle] = useState("");
  const [editorState, setEditorState] = useState(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalEntryDate, setOriginalEntryDate] = useState("");
  const [originalTimestamp, setOriginalTimestamp] = useState(null);
  const mounted = useRef(false);
  const router = useRouter();
  const params = useParams();
  
  useEffect(() => {
    // Set mounted flag to true
    mounted.current = true;
    
    // Client-side only code
    if (typeof window !== 'undefined') {
      try {
        // Import necessary modules
        const { EditorState, ContentState } = require('draft-js');
        const htmlToDraft = require('html-to-draftjs');
        
        // Load the Draft.js CSS
        require('draft-js/dist/Draft.css');
        
        setEditorLoaded(true);
        
        // Get all entries
        const entries = JSON.parse(localStorage.getItem("journalEntries") || "[]");
        
        // Find the entry with the matching id
        const entryIndex = parseInt(params.id);
        if (entryIndex >= 0 && entryIndex < entries.length) {
          const entry = entries[entryIndex];
          
          if (mounted.current) {
            setTitle(entry.title);
            setOriginalEntryDate(entry.date);
            setOriginalTimestamp(entry.timestamp);
            
            // Convert HTML content to Draft.js EditorState
            const contentBlock = htmlToDraft(entry.content);
            if (contentBlock) {
              const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
              setEditorState(EditorState.createWithContent(contentState));
            }
          }
        }
        
        if (mounted.current) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading entry:", error);
        if (mounted.current) {
          setLoading(false);
        }
      }
    }
    
    // Cleanup function to set mounted flag to false
    return () => {
      mounted.current = false;
    };
  }, [params.id]); // Only depend on params.id
  
  // Handle save with localStorage
  const handleSave = () => {
    if (!title.trim()) {
      alert("Please enter a title for your journal entry");
      return;
    }
    
    try {
      // Dynamically import needed modules
      const { convertToRaw } = require('draft-js');
      const draftToHtml = require('draftjs-to-html');
      
      // Convert editor content to HTML
      const contentState = editorState.getCurrentContent();
      const htmlContent = draftToHtml(convertToRaw(contentState));
      
      // Get existing entries
      const existingEntries = JSON.parse(localStorage.getItem("journalEntries") || "[]");
      
      // Find the entry with the matching id
      const entryIndex = parseInt(params.id);
      if (entryIndex >= 0 && entryIndex < existingEntries.length) {
        // Update the entry
        existingEntries[entryIndex] = {
          title: title,
          content: htmlContent,
          date: originalEntryDate,
          timestamp: originalTimestamp || new Date().getTime()
        };
        
        // Save to localStorage
        localStorage.setItem("journalEntries", JSON.stringify(existingEntries));
        
        // Redirect back to the journal entry view
        router.push(`/journal/${entryIndex}`);
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Could not save entry. Please try again.");
    }
  };
  
  // Handle editor state change
  const onEditorStateChange = (newState) => {
    if (mounted.current) {
      setEditorState(newState);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <main className="max-w-4xl mx-auto pt-24 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-150"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-300"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/journal/${params.id}`} className="flex items-center gap-2 text-primary hover:underline">
            <FiArrowLeft size={16} />
            <span>Back to Entry</span>
          </Link>
          
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            <FiSave size={16} />
            <span>Save Changes</span>
          </button>
        </div>
        
        <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entry Title"
            className="w-full text-2xl font-semibold mb-4 p-2 border-b border-gray-700 bg-transparent text-white focus:outline-none focus:border-primary"
          />
          
          <div className="bg-white rounded-md text-black">
            {editorLoaded && editorState && (
              <Editor
                editorState={editorState}
                onEditorStateChange={onEditorStateChange}
                wrapperClassName="demo-wrapper"
                editorClassName="demo-editor"
                editorStyle={{ 
                  height: '400px', 
                  padding: '20px',
                  backgroundColor: 'white',
                  color: 'black',
                  overflow: 'auto'
                }}
                toolbarClassName="toolbar-class"
                toolbar={{
                  options: ['inline', 'blockType', 'fontSize', 'fontFamily', 'list', 'textAlign', 'colorPicker', 'link', 'emoji', 'history'],
                  inline: {
                    options: ['bold', 'italic', 'underline', 'strikethrough'],
                  },
                  blockType: {
                    inDropdown: true,
                    options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote'],
                  },
                  fontSize: {
                    inDropdown: true,
                    options: [8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48],
                  },
                  fontFamily: {
                    inDropdown: true,
                    options: ['Arial', 'Georgia', 'Impact', 'Tahoma', 'Times New Roman', 'Verdana'],
                  },
                  list: {
                    inDropdown: false,
                    options: ['unordered', 'ordered'],
                  },
                  textAlign: {
                    inDropdown: false,
                  },
                  colorPicker: {
                    inDropdown: false,
                  },
                  link: {
                    inDropdown: false,
                    defaultTargetOption: '_blank',
                  },
                  emoji: {
                    inDropdown: false,
                    emojis: [
                      '😀', '😁', '😂', '😃', '😉', '😋', '😎', '😍', '😢', '🤔',
                      '👍', '👏', '🔥', '🎉', '💯', '❤️', '🙌', '💪', '🤝', '✅',
                      '⭐', '🎵', '🎮', '🚀', '🌈', '🍕', '🍦', '🏆', '🎁', '🌟'
                    ],
                  },
                  history: {
                    inDropdown: false,
                  },
                }}
              />
            )}
            {editorLoaded && !editorState && (
              <div className="h-[400px] bg-white flex items-center justify-center text-gray-500">
                Loading content...
              </div>
            )}
          </div>
        </div>
      </main>
      
      <style jsx global>{`
        .rdw-editor-main {
          height: 400px;
          overflow: auto;
          box-sizing: border-box;
        }
        
        .rdw-editor-wrapper {
          width: 100%;
          box-sizing: border-box;
        }
        
        .rdw-editor-toolbar {
          padding: 10px;
          border-radius: 5px 5px 0 0;
          border: 1px solid #F1F1F1;
          border-bottom: none;
          background: white;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 0;
          z-index: 10;
        }
        
        .rdw-option-wrapper {
          border: 1px solid #F1F1F1;
          padding: 5px;
          min-width: 25px;
          height: 25px;
          border-radius: 2px;
          margin: 0 4px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          background: white;
          text-transform: capitalize;
        }
        
        .rdw-option-wrapper:hover {
          box-shadow: 1px 1px 0px #BFBDBD;
        }
        
        .rdw-option-active {
          box-shadow: 1px 1px 0px #BFBDBD inset;
          background-color: #F1F1F1;
        }
        
        .rdw-dropdown-wrapper {
          height: 30px;
          background: white;
          cursor: pointer;
          border: 1px solid #F1F1F1;
          border-radius: 2px;
          margin: 0 3px;
          text-transform: capitalize;
          background: white;
          position: relative;
          display: flex;
          align-items: center;
          min-width: 50px;
        }
        
        .rdw-dropdown-wrapper:hover {
          box-shadow: 1px 1px 0px #BFBDBD;
          background-color: #FFFFFF;
        }
        
        .rdw-dropdown-wrapper:active {
          box-shadow: 1px 1px 0px #BFBDBD inset;
        }
        
        .rdw-dropdown-carettoopen {
          height: 0px;
          width: 0px;
          position: absolute;
          top: 35%;
          right: 10%;
          border-top: 6px solid black;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
        }
        
        .rdw-dropdown-carettoclose {
          height: 0px;
          width: 0px;
          position: absolute;
          top: 35%;
          right: 10%;
          border-bottom: 6px solid black;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
        }
        
        .rdw-dropdown-selectedtext {
          display: flex;
          position: relative;
          height: 100%;
          align-items: center;
          padding: 0 5px;
        }
        
        .rdw-dropdown-optionwrapper {
          z-index: 100;
          position: absolute;
          top: 32px;
          left: 0;
          border: 1px solid #F1F1F1;
          border-radius: 2px;
          background: white;
          width: 98%;
          max-height: 250px;
          overflow-y: scroll;
        }
        
        .rdw-dropdownoption-default {
          min-height: 25px;
          display: flex;
          align-items: center;
          padding: 0 5px;
          white-space: nowrap;
        }
        
        .rdw-dropdownoption-highlighted {
          background-color: #F1F1F1;
        }
        
        .rdw-dropdownoption-active {
          background-color: #f5f5f5;
        }
        
        .rdw-dropdownoption-disabled {
          opacity: 0.3;
          cursor: default;
        }
        
        .rdw-colorpicker-modal {
          position: absolute;
          top: 35px;
          left: 5px;
          display: flex;
          flex-direction: column;
          width: 175px;
          height: 175px;
          border: 1px solid #F1F1F1;
          border-radius: 2px;
          z-index: 100;
          background: white;
          box-shadow: 3px 3px 5px #BFBDBD;
        }
        
        .rdw-colorpicker-option {
          width: 22px;
          height: 22px;
          margin: 3px;
          border-radius: 3px;
          cursor: pointer;
        }
        
        .rdw-link-modal {
          position: absolute;
          top: 35px;
          left: 5px;
          display: flex;
          flex-direction: column;
          width: 235px;
          border: 1px solid #F1F1F1;
          border-radius: 2px;
          z-index: 100;
          background: white;
          box-shadow: 3px 3px 5px #BFBDBD;
          padding: 15px;
        }
        
        .rdw-link-modal-label {
          font-size: 15px;
        }
        
        .rdw-link-modal-input {
          margin-top: 5px;
          border-radius: 2px;
          border: 1px solid #F1F1F1;
          height: 25px;
          margin-bottom: 15px;
          padding: 0 5px;
        }
        
        .rdw-link-modal-buttonsection {
          margin: 0 auto;
        }
        
        .rdw-link-modal-btn {
          margin-left: 10px;
          background: white;
          border: 1px solid #F1F1F1;
          border-radius: 2px;
          cursor: pointer;
          padding: 5px;
          min-width: 60px;
        }
        
        .rdw-link-modal-btn:hover {
          box-shadow: 1px 1px 0px #BFBDBD;
        }
        
        .rdw-link-modal-btn:active {
          box-shadow: 1px 1px 0px #BFBDBD inset;
        }
        
        .rdw-link-modal-btn:focus {
          outline: none !important;
        }
        
        .rdw-link-modal-btn:disabled {
          background: #ece9e9;
        }
        
        .rdw-emoji-modal {
          position: absolute;
          top: 35px;
          left: 5px;
          display: flex;
          flex-wrap: wrap;
          width: 235px;
          border: 1px solid #F1F1F1;
          border-radius: 2px;
          z-index: 100;
          background: white;
          box-shadow: 3px 3px 5px #BFBDBD;
          padding: 15px;
        }
        
        .rdw-emoji-icon {
          width: 24px;
          height: 24px;
          margin: 2px;
          cursor: pointer;
        }
      `}</style>
      
      <Footer />
    </div>
  );
} 