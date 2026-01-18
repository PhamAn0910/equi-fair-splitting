import { VercelRequest, VercelResponse } from '@vercel/node';
import { lemonSqueezySetup, getSubscription } from '@lemonsqueezy/lemonsqueezy.js';
import { createClient } from '@supabase/supabase-js';

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY!;
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Initialize Lemon Squeezy SDK
lemonSqueezySetup({ apiKey: LEMONSQUEEZY_API_KEY });

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

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
        // Get the customer portal URL (update payment method URL works for cancellation too)
        const portalUrl = lsSubscription.data.data.attributes.urls?.update_payment_method;

        if (portalUrl) {
          return res.status(200).json({ portalUrl });
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

    // Final fallback: construct URL using subscription ID
    // Users can manage their subscription through Lemon Squeezy's customer portal
    return res.status(200).json({
      portalUrl: `https://app.lemonsqueezy.com/my-orders`,
    });
  } catch (error: unknown) {
    console.error('Lemon Squeezy Portal Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}

