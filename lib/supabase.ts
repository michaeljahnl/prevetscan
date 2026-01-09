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

// Optional: tripwire to prevent “Claude changed my project ref” incidents
const EXPECTED_PROJECT = 'jjzejgthbefdwarchucw';
if (supabaseProject && supabaseProject !== EXPECTED_PROJECT) {
  console.error('🚨 Supabase project ref mismatch', {
    expected: EXPECTED_PROJECT,
    got: supabaseProject,
  });
  // Uncomment if you want to hard-fail instead of limp along:
  // throw new Error(`Supabase project mismatch (expected ${EXPECTED_PROJECT}, got ${supabaseProject})`);
}

// Safe debug (doesn't leak secrets)
console.log('Supabase init:', {
  project: supabaseProject ? `${supabaseProject.slice(0, 6)}…` : 'MISSING',
  url: supabaseUrl ? `${supabaseUrl.slice(0, 28)}…` : 'MISSING',
  anonKeyLen: supabaseAnonKey ? supabaseAnonKey.length : 0,
});

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