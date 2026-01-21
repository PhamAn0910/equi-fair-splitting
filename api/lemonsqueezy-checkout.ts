import { VercelRequest, VercelResponse } from '@vercel/node';
import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';

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

  const { variantId, userId, email } = req.body;

  // Validate required fields
  if (!userId || !variantId) {
    return res.status(400).json({ error: 'Missing userId or variantId' });
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
          email,
          custom: {
            user_id: userId, // Critical: Used for webhook reconciliation (use snake_case)
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
