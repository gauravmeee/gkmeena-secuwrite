"use client"
import { FiPlus, FiTrash2, FiX, FiCamera, FiSave } from "react-icons/fi";
import Link from "next/link";



// Delete Entries Button
export function DeleteEntriesButton({
    isSelectionMode,
    selectedEntries,
    handleToggleSelectionMode,
    handleDeleteSelected
}){
    return (
        <>
        <button
            onClick={handleToggleSelectionMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors cursor-pointer ${
            isSelectionMode
                ? "bg-gray-600 text-white hover:bg-gray-700"
                : "bg-danger text-white hover:bg-danger-dark"
            }`}
        >
            {isSelectionMode ? <FiX size={18} /> : <FiTrash2 size={18} />}
            <span className="hidden sm:inline">
            {isSelectionMode ? "Cancel" : "Delete Multiple"}
            </span>
        </button>

        {isSelectionMode && selectedEntries.size > 0 && (
            <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-2 bg-danger hover:bg-danger-dark text-white px-4 py-2 rounded-md  transition-colors cursor-pointer border-2 border-transparent"
            >
            <FiTrash2 size={18} />
            <span className="hidden sm:inline">Delete</span> ({selectedEntries.size})
            </button>
        )}
    </>
    );
}




// Create Entry Button
export function NewEntryButton({
    user,
    entryType
}){

    const href = entryType === "diary" ? "/diary/new?type=text" : entryType === "journal" ? "/journal/new" : "#";
    
    return(
        <div className="flex items-center bg-success text-white hover:bg-success-dark rounded-md overflow-hidden">
            <Link
                href= {href}
                onClick={() => {
                if (user) {
                    sessionStorage.setItem(`${entryType}_new_session_${user.id}`, 'true');
                }
                }}
                className="flex items-center gap-2  px-4 py-2  transition-colors"
                title="New Text Entry"
            >
                <FiPlus size={16} />
                <span className="hidden sm:inline">New Entry</span>
            </Link>
            
            {(entryType == "diary")? ( 
                <>
                <div className="h-6 w-px bg-white/30"></div>
                    <Link
                        href="/diary/new?type=image"
                        onClick={() => {
                        if (user) {
                            sessionStorage.setItem(`diary_new_session_${user.id}`, 'true');
                        }
                        }}
                        className="flex items-center gap-2 px-4 py-2 transition-colors"
                        title="New Image Entry"
                    >
                        <FiCamera size={16} />
                    </Link> 
                </>
            ): null }
        </div>
    );
}


// Save Entry Button
export function SaveEntryButton({ onClick, loading }) {
  return (
    <button
        onClick={onClick}
        disabled={loading}
        className={`flex items-center gap-2 bg-success text-white hover:bg-success-dark px-6 py-3 rounded-lg transition-all duration-300 ${
          loading
            ? "bg-opacity-70 cursor-not-allowed"
            : "hover:bg-primary/90 cursor-pointer"
        }`}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <span className="hidden sm:inline">Saving...</span>
          </div>
        ) : (
          <>
            <FiSave size={18} />
            <span className="hidden sm:inline">Save Entry</span>
          </>
        )}
      </button>
  );
}


// {user && (
//   <div className="flex items-center bg-primary rounded-md overflow-hidden">
//     <Link
//       href="/diary/new?type=text"
//       onClick={() => {
//         if (user) {
//           sessionStorage.setItem(`diary_new_session_${user.id}`, 'true');
//         }
//       }}
//       className="flex items-center gap-2 text-white px-4 py-2 hover:bg-primary/90 transition-colors"
//       title="New Text Entry"
//     >
//       <FiPlus size={16} />
//       <span className="hidden sm:inline">New Entry</span>
//     </Link>
//     <div className="h-6 w-px bg-white/30"></div>
//     <Link
//       href="/diary/new?type=image"
//       onClick={() => {
//         if (user) {
//           sessionStorage.setItem(`diary_new_session_${user.id}`, 'true');
//         }
//       }}
//       className="flex items-center gap-2 text-white px-4 py-2 hover:bg-primary/90 transition-colors"
//       title="New Image Entry"
//     >
//       <FiCamera size={16} />
//     </Link>
//   </div>
// )}