import { VercelRequest, VercelResponse } from '@vercel/node';
import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { createClient } from '@supabase/supabase-js';

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY!;
const STORE_ID = process.env.VITE_LEMONSQUEEZY_STORE_ID!;
const APP_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

// Initialize Lemon Squeezy SDK
import { supabaseAdmin } from './_lib/supabase-admin';

lemonSqueezySetup({ apiKey: LEMONSQUEEZY_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Create a Supabase client with the user's token to verify identity
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // Verify the token and get the user
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

  if (authError || !user) {
    console.warn('Checkout auth failed:', authError);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const userId = user.id;
  // Use email from auth if not provided (though body email might be preferred for billing)
  // We'll prioritize the body email for billing notifications, but the userId MUST match the token.
  const { variantId, email } = req.body;

  // Validate required fields
  if (!variantId) {
    return res.status(400).json({ error: 'Missing variantId' });
  }

  try {
    // Check if user is a returning customer (has any subscription record)
    // If they exist in our DB, they have likely used a trial before
    const { data: existingSub } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const shouldSkipTrial = !!existingSub;

    // Create checkout session with user metadata
    const checkout = await createCheckout(
      STORE_ID,
      variantId,
      {
        checkoutData: {
          email: email || user.email, // Fallback to auth email
          custom: {
            user_id: userId, // Critical: Used for webhook reconciliation
          },
        },
        productOptions: {
          redirectUrl: `${APP_URL}/account?success=true`,
        },
        checkoutOptions: {
          skipTrial: shouldSkipTrial,
        },
      }
    );

    // Return the checkout URL to the client
    return res.status(200).json({
      checkoutUrl: checkout.data?.data.attributes.url
    });
  } catch (error: unknown) {
    console.error('Lemon Squeezy Checkout Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
