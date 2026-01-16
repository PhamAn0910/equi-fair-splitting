import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

/**
 * Simple Supabase client for direct database operations
 * Note: RLS policies use the user_id column for security
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
