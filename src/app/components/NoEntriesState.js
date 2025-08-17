import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function NoEntriesState({ type }) {
  const { user, toggleAuthModal } = useAuth();
  
  return (
    <div className="writing-card p-8 text-center">
      <h2 className="text-xl font-medium mb-4 text-foreground">No {type} Entries Yet</h2>
      <p className="text-muted-text mb-6">
        {type === "Journal" 
          ? "Start documenting your thoughts with rich text formatting."
          : "Start recording your daily thoughts and experiences."}
      </p>
      {user ? (
        <Link
          href={`/${type.toLowerCase()}/new`}
          className="btn-writing"
        >
          <FiPlus size={16} />
          <span>Create Your First Entry</span>
        </Link>
      ) : (
        <button
          onClick={toggleAuthModal}
          className="btn-writing"
        >
          <FiPlus size={16} />
          <span>Sign In to Create Entry</span>
        </button>
      )}
    </div>
  );
} 