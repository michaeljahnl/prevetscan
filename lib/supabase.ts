import { createClient } from '@supabase/supabase-js';

// Read env vars
const supabaseProject =
  ((import.meta.env.VITE_SUPABASE_PROJECT as string) ?? '').trim();

const supabaseAnonKey =
  ((import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? '').replace(/\s/g, '');

// Build URL
const supabaseUrl = supabaseProject
  ? `https://${supabaseProject}.supabase.co`
  : '';

// Fail fast if misconfigured
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing Supabase env vars. ` +
    `Project: ${supabaseProject ? 'set' : 'MISSING'}, ` +
    `Anon key: ${supabaseAnonKey ? 'set' : 'MISSING'}`
  );
}

// Create client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);