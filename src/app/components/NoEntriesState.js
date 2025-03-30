import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function NoEntriesState({ type }) {
  const { user, toggleAuthModal } = useAuth();
  
  return (
    <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-8 text-center">
      <h2 className="text-xl font-medium mb-4">No {type} Entries Yet</h2>
      <p className="text-gray-400 mb-6">
        {type === "Journal" 
          ? "Start documenting your thoughts with rich text formatting."
          : "Start recording your daily thoughts and experiences."}
      </p>
      {user ? (
        <Link
          href={`/${type.toLowerCase()}/new`}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-3 rounded-md hover:bg-primary/90 transition-colors"
        >
          <FiPlus size={16} />
          <span>Create Your First Entry</span>
        </Link>
      ) : (
        <button
          onClick={toggleAuthModal}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-3 rounded-md hover:bg-primary/90 transition-colors"
        >
          <FiPlus size={16} />
          <span>Sign In to Create Entry</span>
        </button>
      )}
    </div>
  );
} 