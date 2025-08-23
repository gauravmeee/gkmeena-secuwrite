import { FiPlus, FiTrash2, FiX, FiCamera } from "react-icons/fi";
import Link from "next/link";


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
                    sessionStorage.setItem(`{entryType}_new_session_${user.id}`, 'true');
                }
                }}
                className="flex items-center gap-2  px-4 py-2  transition-colors"
                title="New Text Entry"
            >
                <FiPlus size={16} />
                <span className="hidden sm:inline">New Entry</span>
            </Link>
            <div className="h-6 w-px bg-white/30"></div>
            {(entryType == "diary")? ( 
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
            ): null }
        </div>
    );
}

 