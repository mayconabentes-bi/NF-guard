import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key Length:", supabaseAnonKey?.length || 0);

// Network Health Check
if (supabaseUrl) {
  fetch(`${supabaseUrl}/auth/v1/health`)
    .then(r => console.log("Supabase Health Check:", r.status === 200 ? "OK ✅" : `Error ❌ (${r.status})`))
    .catch(e => console.error("Supabase Network Error 🚨: Não foi possível alcançar o servidor. Verifique sua conexão ou se o domínio está bloqueado.", e));
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

if (!supabase) {
  console.warn("Supabase configuration missing. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env");
}
