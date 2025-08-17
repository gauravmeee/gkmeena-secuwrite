import { FiBook, FiEdit3, FiLock, FiHeart } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function SignInPrompt({ type = "Diary" }) {
  const { toggleAuthModal } = useAuth();
  
  const isJournal = type.toLowerCase() === "journal";
  
  const features = isJournal ? [
    {
      icon: <FiEdit3 className="w-6 h-6" />,
      title: "Rich Text Editor",
      description: "Format your thoughts with bold, italic, images, and more"
    },
    {
      icon: <FiBook className="w-6 h-6" />,
      title: "Organized Entries",
      description: "Keep your journal entries neatly organized and searchable"
    },
    {
      icon: <FiLock className="w-6 h-6" />,
      title: "Private & Secure",
      description: "Your personal thoughts are encrypted and kept private"
    }
  ] : [
    {
      icon: <FiEdit3 className="w-6 h-6" />,
      title: "Text & Image Entries",
      description: "Write your thoughts or capture moments with photos"
    },
    {
      icon: <FiBook className="w-6 h-6" />,
      title: "Daily Reflections",
      description: "Record your daily experiences and personal growth"
    },
    {
        icon: <FiLock className="w-6 h-6" />,
        title: "Secure & Private",
        description: "Your diary is encrypted, accessible only by you"
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
            Your Personal {type}
          </h1>
          
          <p className="text-lg font-medium mb-4">
              Sign in to <span className="text-primary">Create</span> and <span className="text-secondary">Access</span> your {type}.
          </p>
          <button
              onClick={toggleAuthModal}
              className="btn-writing"
          >
              Sign In
          </button>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="writing-card p-6 text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-lg mb-4 text-primary">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-text text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Privacy Note */}
        <div className="text-center mt-8">
          <p className="text-muted-text text-sm">
            🔒 Your data is encrypted and secure. We respect your privacy.
          </p>
        </div>
      </main>
    </div>
  );
} 