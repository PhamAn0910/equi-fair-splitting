import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Creates a Supabase client with the user's Clerk JWT token
 * for authenticated requests that respect RLS policies
 * 
 * @param getToken - Function from Clerk's useAuth() hook
 */
export const createSupabaseClient = async (
  getToken: (options?: { template?: string }) => Promise<string | null>
) => {
  const token = await getToken({ template: 'supabase' });
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

/**
 * Basic Supabase client for public operations
 * Note: RLS policies will block most operations without auth
 */
export const supabase = createClient(supabaseUrl, supabaseKey);
