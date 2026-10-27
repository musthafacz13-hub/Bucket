import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to read environment variables safely in both Vite (client) and Node.js (test runners)
const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return String(import.meta.env[key]).trim();
    }
  } catch {
    // Ignore import.meta access errors in non-ESM runtimes
  }
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return String(process.env[key]).trim();
    }
  } catch {
    // Ignore process access errors
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

/**
 * Checks whether valid Supabase public credentials are present in the environment.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

export const getSupabaseConfig = (): { url: string; hasKey: boolean } => {
  return {
    url: supabaseUrl,
    hasKey: Boolean(supabaseAnonKey),
  };
};

/**
 * Singleton Supabase client instance.
 * Returns null if credentials are not provided, preventing unhandled runtime exceptions.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
