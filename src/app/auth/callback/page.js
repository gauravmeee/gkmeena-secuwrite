"use client";

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import supabase from '../../../lib/supabase';

function AuthCallbackContent() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from the URL if it exists
        const hashParams = window.location.hash;
        if (hashParams) {
          // Remove the '#' from the hash
          const cleanHash = hashParams.substring(1);
          // Parse the hash parameters
          const params = new URLSearchParams(cleanHash);
          const accessToken = params.get('access_token');
          
          if (accessToken) {
            // Set the session in Supabase
            const { data: { session }, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: params.get('refresh_token'),
            });

            if (error) throw error;

            // If successful, redirect to home page
            if (session) {
              router.push('/');
              return;
            }
          }
        }

        // If we have a user but no hash params, also redirect to home
        if (user) {
          router.push('/');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.push('/');
      }
    };

    handleAuthCallback();
  }, [router, user]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse"></div>
        <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-150"></div>
        <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-300"></div>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse"></div>
          <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-150"></div>
          <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-300"></div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
} 