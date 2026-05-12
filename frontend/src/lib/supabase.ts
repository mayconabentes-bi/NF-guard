import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key Length:", supabaseAnonKey?.length || 0);

// Supabase client initialization

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

if (!supabase) {
  console.warn("Supabase configuration missing. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env");
}
