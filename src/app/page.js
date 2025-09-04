"use client";


import HeroSection from "../components/HeroSection";
import MainSection from "../components/HomeContent";
import FloatingActionButton from "../components/FloatingActionButton";
import { LazyEncryptionMigration } from "../utils/componentUtils";
import { useAuth } from "../context/AuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import { useState } from "react";


export default function Home() {

  const { user} = useAuth();
  const [hideFloatingButton, setHideFloatingButton] = useState(false);
  

  return (
    <div className="bg-background text-foreground">

      <LoadingProvider>
        <HeroSection />
        <MainSection setHideFloatingButton={setHideFloatingButton} />
      </LoadingProvider>
      
      {/* Floating Action Button */}
      {user && !hideFloatingButton && <FloatingActionButton />}
      
      {/* Lazy load encryption migration */}
      {user && <LazyEncryptionMigration userId={user.id} />}
    </div>
  );
}
