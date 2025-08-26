"use client";


import HeroSection from "../components/HeroSection";
import MainSection from "../components/HomeContent";
import FloatingActionButton from "../components/FloatingActionButton";
import { LazyEncryptionMigration } from "../utils/componentUtils";
import { useAuth } from "../context/AuthContext";
import { LoadingProvider } from "@/context/LoadingContext";



export default function Home() {

  const { user} = useAuth();
  

  return (
    <div className="bg-background text-foreground">

      <LoadingProvider>
        <HeroSection />
        <MainSection />
      </LoadingProvider>
      
      
      {/* Main Content Section */}
      {/* <div id="content-section" className="relative"> */}
        {/* Content Section Component */}
        
      {/* </div> */}
      
      {/* Floating Action Button */}
      {user && <FloatingActionButton />}
      
      {/* Lazy load encryption migration */}
      {user && <LazyEncryptionMigration userId={user.id} />}
    </div>
  );
}
