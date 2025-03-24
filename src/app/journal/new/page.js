"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "../../components/Navbar";
import { useRouter } from "next/navigation";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import dynamic from "next/dynamic";
import Footer from "../../components/Footer";
import { useAuth } from "../../../context/AuthContext";
import databaseUtils from "../../../lib/database";

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

export default function NewJournalEntry() {
  const [title, setTitle] = useState("");
  const [editorState, setEditorState] = useState(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(false);
  const router = useRouter();
  const { user } = useAuth();
  
  useEffect(() => {
    // Set mounted flag to true
    mounted.current = true;
    
    // Client-side only code
    if (typeof window !== 'undefined') {
      try {
        // Import necessary modules
        const { EditorState } = require('draft-js');
        
        // Load the Draft.js CSS
        require('draft-js/dist/Draft.css');
        
        if (mounted.current) {
          setEditorLoaded(true);
          setEditorState(EditorState.createEmpty());
        }
      } catch (error) {
        console.error("Error initializing editor:", error);
      }
    }
    
    // Cleanup function to set mounted flag to false
    return () => {
      mounted.current = false;
    };
  }, []); // Empty dependency array so it only runs once
  
  // Handle save with Supabase or localStorage
  const handleSave = async () => {
    try {
      setLoading(true);
  
      // Dynamically import needed modules
      const { convertToRaw } = require('draft-js');
      const draftToHtml = require('draftjs-to-html');
  
      // Convert editor content to HTML
      const contentState = editorState.getCurrentContent();
      const htmlContent = draftToHtml(convertToRaw(contentState));
  
      // Use "Untitled" if no title is provided
      const newEntry = {
        title: title.trim() || "Untitled",   // Fallback to "Untitled"
        content: htmlContent,
        date: new Date().toLocaleDateString(),
        timestamp: new Date().getTime(),
      };
  
      // If user is logged in, save to Supabase
      if (user) {
        await databaseUtils.createJournalEntry(user.id, newEntry);
      } 
      // Otherwise, save to localStorage
      else {
        const existingEntries = JSON.parse(localStorage.getItem("journalEntries") || "[]");
        existingEntries.unshift(newEntry);
        localStorage.setItem("journalEntries", JSON.stringify(existingEntries));
      }
  
      router.push("/journal");
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Could not save entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  
  // Handle editor state change
  const onEditorStateChange = (newState) => {
    if (mounted.current) {
      setEditorState(newState);
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <Link href="/journal" className="flex items-center gap-2 text-primary hover:underline">
            <FiArrowLeft size={16} />
            <span>Back to Journal</span>
          </Link>
          
          <button 
            onClick={handleSave}
            disabled={loading || !editorLoaded || !editorState}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <FiSave size={16} />
            <span>{loading ? "Saving..." : "Save Entry"}</span>
          </button>
        </div>
        
        <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6">
        <div className="relative w-full">
  {/* Journal Title Input */}
  <input
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="Untitled"
    className="w-full text-2xl font-semibold p-2 pr-32 border-b border-gray-700 bg-transparent text-white focus:outline-none focus:border-primary"
  />

  {/* Date and Time */}
  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
    {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
  </span>
</div>
          
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
              <div className="h-[400px] bg-white flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse"></div>
                  <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-150"></div>
                  <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-300"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
      
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
    </div>
  );
} 