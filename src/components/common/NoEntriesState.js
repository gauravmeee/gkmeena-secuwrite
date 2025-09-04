import Link from "next/link";
import { FiPlus, FiBook, FiHeart, FiShield, FiLock, FiEdit3, FiImage } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";

export default function NoEntriesState({ type }) {
  const { user, toggleAuthModal } = useAuth();
  
  const isJournal = type.toLowerCase() === "journal";
  
  const features = isJournal ? [
    {
      icon: <FiShield className="w-6 h-6" />,
      title: "End-to-End Encrypted",
      description: "Your journal entries are fully encrypted and secure"
    },
    {
      icon: <FiLock className="w-6 h-6" />,
      title: "Lock & Draft Features",
      description: "Lock private entries and save drafts for later"
    },
    {
      icon: <FiEdit3 className="w-6 h-6" />,
      title: "Rich Text Editor",
      description: "Format your thoughts with bold, italic, links, and more"
    }
  ] : [
    {
      icon: <FiShield className="w-6 h-6" />,
      title: "End-to-End Encrypted",
      description: "Your diary entries are fully encrypted and secure"
    },
    {
      icon: <FiImage className="w-6 h-6" />,
      title: "Images & Handwritten",
      description: "Add photos and handwritten-style entries to your diary"
    },
    {
      icon: <FiLock className="w-6 h-6" />,
      title: "Lock & Draft Features",
      description: "Lock private entries and save drafts for later"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-4xl mx-auto pt-8 px-4 pb-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full mb-6">
            {isJournal ? (
              <FiBook className="w-10 h-10 text-primary" />
            ) : (
              <FiHeart className="w-10 h-10 text-primary" />
            )}
          </div>
          
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            No {type} Entries Yet
          </h1>
          
          <p className="text-lg font-medium mb-6">
            {type === "Journal" 
              ? "Start documenting your thoughts with rich text formatting."
              : "Start recording your daily thoughts and experiences."}
          </p>
          
          {/* Centered Create Entry Button */}
          <div className="flex justify-center">
            {user ? (
              <Link
                href={`/${type.toLowerCase()}/new`}
                className="btn-writing inline-flex items-center gap-2 px-8 py-3 text-base font-medium rounded-lg transition-all hover:scale-105 shadow-md hover:shadow-lg group"
              >
                <FiPlus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Create Your First {type} Entry</span>
              </Link>
            ) : (
              <button
                onClick={toggleAuthModal}
                className="btn-writing inline-flex items-center gap-2 px-8 py-3 text-base font-medium rounded-lg transition-all hover:scale-105 shadow-md hover:shadow-lg group"
              >
                <FiPlus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Sign In to Start Writing</span>
              </button>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="writing-card p-6 text-center group hover:shadow-lg transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-lg mb-4 text-primary group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-text text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Privacy Note */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-bg-overlay rounded-full border border-border-primary">
            <FiShield className="w-4 h-4 text-primary" />
            <p className="text-muted-text text-sm">
              Your {type.toLowerCase()} entries are end-to-end encrypted and secure.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}