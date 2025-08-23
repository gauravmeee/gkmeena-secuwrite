import { useState, useEffect } from "react";
import { FiFeather, FiBook, FiEdit3, FiChevronRight } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "../context/AuthContext"; // adjust path

export default function HeroSection() {
  const [currentTypeIndex, setCurrentTypeIndex] = useState(0);
  const { user } = useAuth();

  const contentTypes = [
    { name: "Journal", icon: <FiBook /> },
    { name: "Diary", icon: <FiEdit3 /> },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTypeIndex((prev) => (prev + 1) % contentTypes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Hero Section
  return (
    <section className={`flex flex-col bg-gradient-to-r from-primary/10 to-secondary/30 ${user ? "h-[calc(100vh-20vh)] min-h-[calc(100vh-20vh)]" :"h-[calc(100vh-10vh)] min-h-[calc(100vh-10vh)]" }`}>
      {/* Top Section */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-8  pt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-7xl w-full">
          {/* Left Content */}
          <div className="md:col-span-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              <FiFeather className="w-4 h-4" />
              <span>Personal Journaling App</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-foreground mb-4">
              Capture your <span className="text-primary">thoughts</span> in any format
            </h1>

            <p className="text-base sm:text-lg text-muted-text max-w-2xl mx-auto md:mx-0">
              A versatile writing platform for all your creative needs – from daily
              journal entries to poems, stories, and inspirational quotes.
            </p>
          </div>

          {/* Right Side */}
          <div className="md:col-span-1 flex justify-center pb-5">
            <div className="relative">
              <FiFeather className="w-16 sm:w-20 lg:w-24 h-16 sm:h-20 lg:h-24 text-primary/60 animate-pulse" />

              {/* Floating circles */}
              <div className="absolute -top-4 -left-4 w-4 h-4 bg-secondary/20 rounded-full animate-bounce" style={{ animationDelay: "0.5s" }} />
              <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: "1s" }} />

              {/* Rotating Text */}
              <div className="mt-6 text-center">
                <div className="text-lg sm:text-xl text-muted-text mb-2">
                  {contentTypes[currentTypeIndex].name}
                </div>
                <div className="w-12 h-0.5 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section (Links) */}
      <div className="flex w-full h-[20vh]">
        {/* Diary Entries */}
        <Link
          href="/diary"
          className="flex-1 group relative flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
          <div className="relative flex items-center gap-2 text-white">
            <h2 className="text-xl font-bold">Diary Entries</h2>
            <FiChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Journal Entries */}
        <Link
          href="/journal"
          className="flex-1 group relative flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
          <div className="relative flex items-center gap-2 text-white">
            <h2 className="text-xl font-bold">Journal Entries</h2>
            <FiChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
      
    </section>
  );
}
