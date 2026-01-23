import { VercelRequest, VercelResponse } from '@vercel/node';
import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { createClient } from '@supabase/supabase-js';

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY!;
const STORE_ID = process.env.VITE_LEMONSQUEEZY_STORE_ID!;
const APP_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

import { createHmac } from 'crypto';

// Initialize Lemon Squeezy SDK
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const jwtSecret = process.env.SUPABASE_JWT_SECRET!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

lemonSqueezySetup({ apiKey: LEMONSQUEEZY_API_KEY });

async function verifyAuthToken(token: string, supabaseClient: any) {
  // First try standard Supabase auth
  const { data: { user }, error } = await supabaseClient.auth.getUser();

  if (!error && user) {
    return user;
  }

  // If error is strictly about JWT claims (like UUID validation), try manual verification
  // This is needed because Clerk user IDs are not UUIDs (e.g. "user_2...")
  // but Supabase's GoTrue client strictly enforces UUID format for 'sub' claim
  if (error && jwtSecret) {
    try {
      // Manual JWT Verification
      const [header, payload, signature] = token.split('.');
      if (!header || !payload || !signature) throw new Error('Invalid token format');

      const signatureInput = `${header}.${payload}`;
      const hmac = createHmac('sha256', jwtSecret);
      const calculatedSignature = hmac.update(signatureInput).digest('base64url');

      if (signature !== calculatedSignature) {
        throw new Error('Invalid signature');
      }

      // Decode payload
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));

      // Check expiration
      if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
        throw new Error('Token expired');
      }

      // Return synthetic user object
      return {
        id: decodedPayload.sub,
        email: decodedPayload.email,
        app_metadata: decodedPayload.app_metadata || {},
        user_metadata: decodedPayload.user_metadata || {},
        aud: decodedPayload.aud,
        created_at: new Date().toISOString(),
      };
    } catch (manualVerifyError) {
      console.warn('Manual JWT verification failed:', manualVerifyError);
    }
  }

  return null;
}

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
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Create a Supabase client with the user's token (still useful for context)
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // Verify the token (supports both Supabase UUIDs and Clerk IDs via manual verify)
  const user = await verifyAuthToken(token, supabaseClient);

  if (!user) {
    console.warn('Checkout auth failed: Invalid token or user');
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
