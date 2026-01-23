import { VercelRequest, VercelResponse } from '@vercel/node';
import { lemonSqueezySetup, getSubscription } from '@lemonsqueezy/lemonsqueezy.js';
import { createClient } from '@supabase/supabase-js';

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY!;
// Initialize Lemon Squeezy SDK
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const jwtSecret = process.env.SUPABASE_JWT_SECRET!;

// Initialize Lemon Squeezy SDK
lemonSqueezySetup({ apiKey: LEMONSQUEEZY_API_KEY });

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verifyAuthToken(token: string, supabaseClient: any) {
  // First try standard Supabase auth
  const { data: { user }, error } = await supabaseClient.auth.getUser();

  if (!error && user) {
    return user;
  }

  // If error is strictly about JWT claims (like UUID validation), try manual verification
  if (error && jwtSecret) {
    try {
      // Manual JWT Verification
      const [header, payload, signature] = token.split('.');
      if (!header || !payload || !signature) throw new Error('Invalid token format');

      const signatureInput = `${header}.${payload}`;
      const hmac = crypto.createHmac('sha256', jwtSecret);
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
  // Only allow GET requests
  if (req.method !== 'GET') {
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

  // Create a Supabase client with the user's token (still useful for RLS context)
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // Verify the token using our hybrid helper
  const user = await verifyAuthToken(token, supabaseClient);

  if (!user) {
    console.warn('Portal auth failed: Invalid token or user');
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const userId = user.id;

  try {
    // Get user's subscription from database
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('lemonsqueezy_subscription_id')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription?.lemonsqueezy_subscription_id) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Get subscription from Lemon Squeezy to get the update URL
    try {
      const lsSubscription = await getSubscription(subscription.lemonsqueezy_subscription_id);

      if (lsSubscription.data?.data) {
        // Get the signed customer portal URL (this is the correct field for subscription management)
        const portalUrl = lsSubscription.data.data.attributes.urls?.customer_portal;

        if (portalUrl) {
          return res.status(200).json({ portalUrl });
        }

        // Fallback: try update_payment_method URL (also allows cancellation)
        const updateUrl = lsSubscription.data.data.attributes.urls?.update_payment_method;
        if (updateUrl) {
          return res.status(200).json({ portalUrl: updateUrl });
        }

        // Fallback: construct customer portal URL using order ID if available
        const orderId = lsSubscription.data.data.attributes.order_id;
        if (orderId) {
          return res.status(200).json({
            portalUrl: `https://app.lemonsqueezy.com/my-orders/${orderId}`,
          });
        }
      }
    } catch (lsError) {
      console.error('Error fetching subscription from Lemon Squeezy:', lsError);
      // Continue to fallback
    }

    // Final fallback: use your branded customer portal URL
    return res.status(200).json({
      portalUrl: `https://quean.lemonsqueezy.com/billing`,
    });
  } catch (error: unknown) {
    console.error('Lemon Squeezy Portal Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}

