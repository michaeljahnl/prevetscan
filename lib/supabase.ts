import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

console.log('Supabase init:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'MISSING'
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Missing Supabase env vars. URL: ${supabaseUrl ? 'set' : 'MISSING'}, Key: ${supabaseAnonKey ? 'set' : 'MISSING'}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
