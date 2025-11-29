import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'demo' && supabaseAnonKey !== 'demo') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase initialized successfully');
  } catch (error) {
    console.warn('Supabase initialization error:', error);
  }
} else {
  console.warn('Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env file');
}

export default supabase;

