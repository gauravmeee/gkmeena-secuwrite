import { useState, useEffect } from "react";
import { FiArrowDown } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function HeroSection() {
  // Array of content types to cycle through in the animation
  const contentTypes = [
    { name: "journals", icon: "📒", color: "text-green-400" },
    { name: "diaries", icon: "📓", color: "text-blue-400" },
    { name: "stories", icon: "✍️", color: "text-yellow-400" },
    { name: "poems", icon: "🎵", color: "text-purple-400" },
    { name: "quotes", icon: "💬", color: "text-pink-400" }
  ];
  
  const [currentTypeIndex, setCurrentTypeIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const { user, toggleAuthModal } = useAuth();
  
  // Animation effect to cycle through content types
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentTypeIndex((prevIndex) => (prevIndex + 1) % contentTypes.length);
        setIsVisible(true);
      }, 300); // Faster fade out for smoother animation
    }, 3000); 
    
    return () => clearInterval(interval);
  }, []);
  
  // Scroll to content section
  const scrollToContent = () => {
    // If user is not logged in, show auth modal instead
    if (!user) {
      toggleAuthModal();
      return;
    }
    
    const contentSection = document.getElementById('content-section');
    if (contentSection) {
      // Calculate the offset from the top of the page to the content section
      const offsetTop = contentSection.offsetTop;
      const navbarHeight = 80;
      
      window.scrollTo({
        top: offsetTop - navbarHeight,
        behavior: 'smooth'
      });
    }
  };
  
  return (
    <div className="pt-32 pb-20 min-h-[90vh] flex items-center">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-center">
          {/* Content - 3 columns on md+ */}
          <div className="md:col-span-3 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-primary font-medium text-sm">Personal Journaling App</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Capture your <span className="text-primary">thoughts</span> in any format
            </h1>
            
            <div className="h-12 my-2">
              <div className={`transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{contentTypes[currentTypeIndex].icon}</span>
                  <span className={`text-2xl font-medium ${contentTypes[currentTypeIndex].color}`}>
                    {contentTypes[currentTypeIndex].name}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-gray-300 text-lg max-w-xl">
              A versatile writing platform for all your creative needs - from daily journal entries to poems, stories, and inspirational quotes.
            </p>
            
            <div className="pt-4">
              <button 
                onClick={scrollToContent}
                className="group bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-md flex items-center gap-3 transition-all font-medium text-lg hover:shadow-lg hover:shadow-primary/20"
              >
                <span>{user ? 'Get Started' : 'Sign In to Get Started'}</span>
                <FiArrowDown size={18} className="group-hover:animate-bounce" />
              </button>
            </div>
          </div>
          
          {/* Preview - 2 columns on md+ */}
          <div className="hidden md:block md:col-span-2">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-lg blur-xl opacity-50"></div>
              <div className="relative bg-gray-900/90 backdrop-blur p-6 rounded-lg border border-gray-800 shadow-2xl overflow-hidden">
                {/* Content type selector */}
                <div className="flex items-center space-x-3 mb-6">
                  {contentTypes.map((type, index) => (
                    <button 
                      key={type.name}
                      className={`h-9 w-9 flex items-center justify-center rounded-full transition-all duration-300 text-xl
                        ${index === currentTypeIndex 
                          ? 'bg-gradient-to-r from-primary/90 to-purple-600/90 scale-110 shadow-lg' 
                          : 'bg-gray-800/80 hover:bg-gray-800'}`}
                      onClick={() => setCurrentTypeIndex(index)}
                    >
                      {type.icon}
                    </button>
                  ))}
                </div>
                
                {/* Title field */}
                <div className="h-9 bg-gray-800/80 rounded-md w-2/3 mb-4 px-3 flex items-center">
                  <div className="h-2 bg-white/20 rounded w-1/2"></div>
                </div>
                
                {/* Editor toolbar */}
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-8 w-8 bg-gray-800/80 rounded-md flex items-center justify-center">
                      <div className="h-3 w-3 rounded-full bg-primary/40"></div>
                    </div>
                  ))}
                </div>
                
                {/* Content preview */}
                <div className="h-40 bg-gray-800/60 rounded-md relative overflow-hidden mb-4">
                  <div className={`absolute inset-0 p-4 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{contentTypes[currentTypeIndex].icon}</span>
                        <div className="h-3 bg-white/20 rounded w-1/3"></div>
                      </div>
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-2.5 bg-white/20 rounded w-full" style={{width: `${Math.random() * 30 + 70}%`}}></div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-3">
                  <div className="h-9 bg-primary rounded-md w-1/3 flex items-center justify-center">
                    <div className="h-2 bg-white/60 rounded w-2/3"></div>
                  </div>
                  <div className="h-9 bg-gray-800/80 rounded-md w-1/3 flex items-center justify-center">
                    <div className="h-2 bg-white/20 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 