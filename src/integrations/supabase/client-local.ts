
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables if available, otherwise fall back to hardcoded values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://vuwfllutcznyygbxkegu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1d2ZsbHV0Y3pueXlnYnhrZWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDIyNTUsImV4cCI6MjA2NDYxODI1NX0.uBFyJwIf6V_50XiOhMkkFDu6ArZKHhc1PkOXMokF-Qw";

// Export the supabase client for local development
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

console.log('Supabase client initialized with URL:', SUPABASE_URL);
