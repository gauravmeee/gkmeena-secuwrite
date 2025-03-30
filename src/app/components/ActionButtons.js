import Link from "next/link";
import { FiPlus, FiTrash2, FiX, FiEdit2 } from "react-icons/fi";

export default function ActionButtons({ 
  user, 
  hasEntries, 
  isSelectionMode, 
  selectedCount, 
  onToggleSelection, 
  onDeleteSelected,
  type // "journal" or "diary"
}) {
  return (
    <div className="flex gap-2">
      {user && hasEntries && (
        <>
          <button
            onClick={onToggleSelection}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              isSelectionMode
                ? "bg-gray-600 text-white hover:bg-gray-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {isSelectionMode ? <FiX size={18} /> : <FiTrash2 size={18} />}
            <span className="hidden sm:inline">
              {isSelectionMode ? "Cancel" : "Delete Multiple"}
            </span>
          </button>

          {isSelectionMode && selectedCount > 0 && (
            <button
              onClick={onDeleteSelected}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              <FiTrash2 size={18} />
              <span className="hidden sm:inline">Delete</span> ({selectedCount})
            </button>
          )}
        </>
      )}
      
      {user && (
        <Link
          href={`/${type}/new`}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          <FiPlus size={16} />
          <span className="hidden sm:inline">New Entry</span>
        </Link>
      )}
    </div>
  );
} 