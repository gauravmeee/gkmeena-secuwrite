import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://btlgquarcynurgrrhzhs.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bGdxdWFyY3ludXJncnJoemhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3Mjg3MzIsImV4cCI6MjA1ODMwNDczMn0.hAhyY8s0vKc8G5FEVAwB8U1JeS36lOJphXP2YvoBr1c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase; 