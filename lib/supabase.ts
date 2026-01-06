import { createClient } from '@supabase/supabase-js';

const supabaseProject =
  ((import.meta.env.VITE_SUPABASE_PROJECT as string) ?? '').trim();

const supabaseUrl = supabaseProject
  ? `https://${supabaseProject}.supabase.co`
  : '';

const supabaseAnonKey = (
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? ''
).replace(/\s/g, ''); // removes ALL whitespace, including hidden newlines

console.log('Supabase init:', {
  project: supabaseProject ? `${supabaseProject.substring(0, 6)}... (len ${supabaseProject.length})` : 'MISSING',
  url: supabaseUrl ? `${supabaseUrl.substring(0, 25)}... (len ${supabaseUrl.length})` : 'MISSING',
  keyHasLF: supabaseAnonKey.includes('\n'),
  keyHasCR: supabaseAnonKey.includes('\r'),
  keyLen: supabaseAnonKey.length,
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing Supabase env vars. Project: ${supabaseProject ? 'set' : 'MISSING'}, Key: ${supabaseAnonKey ? 'set' : 'MISSING'}`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
