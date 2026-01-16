import { createClient } from '@supabase/supabase-js';

// Note: Use process.env for Node.js environment (server-side)
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase Server Environment Variables');
}

/**
 * Supabase Admin Client
 * This client has full admin access and BYPASSES Row Level Security (RLS)
 * Only use in serverless functions for privileged operations
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
