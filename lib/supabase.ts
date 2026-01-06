import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? '✓' : '✗ VITE_SUPABASE_URL',
    key: supabaseAnonKey ? '✓' : '✗ VITE_SUPABASE_ANON_KEY'
  });
  throw new Error(`Missing Supabase env vars. URL: ${supabaseUrl ? 'set' : 'MISSING'}, Key: ${supabaseAnonKey ? 'set' : 'MISSING'}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
