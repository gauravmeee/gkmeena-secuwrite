"use client";

import HeroSection from "../components/HeroSection";
import MainSection from "../components/MainSection";
import FloatingActionButton from "../components/FloatingActionButton";
import { LazyEncryptionMigration } from "../utils/componentUtils";
import { useAuth } from "../context/AuthContext";



export default function Home() {

  const { user} = useAuth();
  

  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Main Content Section */}
      <div id="content-section" className="relative">
        {/* Content Section Component */}
        <MainSection />
      </div>
      
      {/* Floating Action Button */}
      {user && <FloatingActionButton />}
      
      {/* Lazy load encryption migration */}
      {user && <LazyEncryptionMigration userId={user.id} />}
    </div>
  );
}
