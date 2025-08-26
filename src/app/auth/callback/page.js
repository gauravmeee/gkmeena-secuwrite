"use client";

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/common/Loading';
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
    <Loading/>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <Loading/>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
} 