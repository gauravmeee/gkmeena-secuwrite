import { FiBook, FiEdit3, FiLock, FiHeart, FiImage, FiFileText, FiShield } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";

export default function SignInPrompt({ type = "Diary" }) {
  const { toggleAuthModal } = useAuth();
  
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
        <div className="text-center sm:mt-6 md:mt-8 mb-6 md:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full mb-4 md:mb-6">
            {isJournal ? (
              <FiBook className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            ) : (
              <FiHeart className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            )}
          </div>
          
          <h1 className="text-2xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Your Personal {type}
          </h1>
          
          <p className="text-lg font-medium mb-6">
            Sign in to <span className="text-primary">Create</span> and <span className="text-secondary">Access</span> your {type}.
          </p>
          
          {/* Centered Sign In Button */}
          <div className="flex justify-center">
            <button
              onClick={toggleAuthModal}
              className="btn-writing px-8 py-3 text-base font-medium rounded-lg transition-all hover:scale-105 shadow-md hover:shadow-lg"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-8 mb:6 md:mb-12">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="writing-card p-4 md:p-6 flex flex-col items-center text-center group hover:shadow-lg transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-8 h-8 md:w-12 md:h-12 bg-primary/20 rounded-lg text-primary mb-2 md:mb-4 group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-sm md:text-lg font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-muted-text text-xs md:text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>


        {/* Privacy Note */}
        <div className="text-center mt-6 md:mt-12">
          <p className="text-warning text-sm font-medium inline-flex items-center gap-2 justify-center">
            <FiShield className="w-4 h-4 text-primary" />
            Your data is end-to-end encrypted and secure. We respect your privacy.
          </p>
        </div>
      </main>
    </div>
  );
}