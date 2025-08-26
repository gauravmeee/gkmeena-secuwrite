"use client"

import { FiSave, FiImage, FiFileText, FiEdit2, FiTrash2, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";



// Back Button (New Entry Page - Diary)
export function BackButton({ href }) {

  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-primary hover:underline"
    >
      <FiArrowLeft size={16} />
      <span>Back</span>
    </Link>
  );
}

// Entry Edit and DeleteButton
export function EditDeleteButton({ editLink, onDelete }) {
  return (
    <div className="flex item-center gap-3">
      {editLink && (
        <Link
          href={editLink}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors cursor-pointer"
        >
          <FiEdit2 size={16} />
          <span className="hidden sm:inline">Edit</span>
        </Link>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="flex items-center gap-2 text-red-500 hover:text-red-500/80 transition-colors cursor-pointer"
        >
          <FiTrash2 size={16} />
          <span className="hidden sm:inline">Delete</span>
        </button>
      )}
    </div>
  );
}


    
// Drafts View Button
export function DraftsViewButton({
    entryType,
    draftsCount
}){
    const href = entryType === "diary" ? "/diary/draft" : entryType === "journal" ? "/journal/draft" : "#";

    return(
        <Link
            href={href}
            className="text-danger hover:text-danger/90 transition-colors flex items-center gap-1"
            >
            <span className="hidden sm:inline">Drafts</span>
            <span className="bg-danger hover:bg-danger/90 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                {draftsCount}
            </span>
        </Link>    
    );
}

// Toggle Image & Text Diary Entry
export function ToggleImageButton({entryFormat}){
    return (
        <Link
            href={entryFormat === 'text' ? '/diary/new?type=image' : '/diary/new?type=text'}
            className="text-primary hover:text-primary/90 transition-colors flex items-center gap-2 px-3 py-2"
        >
            {entryFormat === 'text' ? (
            <>
                <FiImage size={18} />
                <span>Image Entry</span>
            </>
            ) : (
            <>
                <FiFileText size={18} />
                <span>Text Entry</span>
            </>
            )}
        </Link>
    );
}


// Draft Entries - Edit Save Delete
export function EditSaveDeleteButton({ onEdit, onSave, onDelete, saving }) {
  return (
    <div className="flex items-center gap-3">

    <button
      onClick={() => onEdit}
      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors cursor-pointer"
    >
      <FiEdit2 size={16} />
      <span>Edit</span>
    </button>

    <button
      onClick={() => onSave}
      disabled={saving}
      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors cursor-pointer"
    >
      <FiSave size={16} />
      <span>Save</span>
    </button>
    
    <button
      onClick={onDelete}
      className="flex items-center gap-2 text-red-500 hover:text-red-500/80 transition-colors cursor-pointer"
    >
      <FiTrash2 size={16} />
      <span>Delete</span>
    </button>
  </div>
)}