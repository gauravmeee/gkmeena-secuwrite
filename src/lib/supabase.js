import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wxclfwyhdmssgflehjfo.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4Y2xmd3loZG1zc2dmbGVoamZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4Mzc1MTYsImV4cCI6MjA3MjQxMzUxNn0.l2A38qTc9QPB1p18qPGYa32L-s_1tOosMQ_m4Xk4KpI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
});

export default supabase; 