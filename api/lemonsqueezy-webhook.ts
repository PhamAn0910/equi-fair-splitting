import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Inline Supabase Admin Client (avoids module resolution issues in Vercel)
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// CRITICAL: Disable body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buffer(readable: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function verifySignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Helper to determine plan type from variant ID
function getPlanType(variantId: string | number | undefined): 'free' | 'pro' {
  if (!variantId) return 'free';
  
  const variantStr = String(variantId);
  const proVariantId = String(process.env.LEMONSQUEEZY_PRO_VARIANT_ID || '');
  
  console.log('getPlanType - variantId:', variantStr, 'proVariantId:', proVariantId);
  
  if (proVariantId && variantStr === proVariantId) return 'pro';
  
  // If variant exists but doesn't match env vars, default to pro (they paid for something)
  if (variantStr && variantStr !== '') return 'pro';
  
  return 'free';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const rawBody = await buffer(req);
  const signature = req.headers['x-signature'] as string;

  if (!signature) {
    console.error('Missing X-Signature header');
    return res.status(401).send('Missing signature');
  }

  // Verify webhook signature
  if (!verifySignature(rawBody, signature, webhookSecret)) {
    console.error('Invalid webhook signature');
    return res.status(401).send('Invalid signature');
  }

  const payload = JSON.parse(rawBody.toString());
  const { meta, data } = payload;
  const eventType = meta.event_name;

  // Extract userId from custom data (supports both user_id and userId)
  const userId =
    meta.custom_data?.user_id ||
    meta.custom_data?.userId ||
    data.attributes?.first_order_item?.custom_data?.user_id;

  console.log('Webhook received:', eventType, 'userId:', userId);

  if (!userId) {
    console.error('No userId found in webhook payload:', JSON.stringify(meta.custom_data));
    return res.status(400).send('Missing userId');
  }

  try {
    switch (eventType) {
      case 'order_created': {
        // Provision access when order is created
        const order = data.attributes;
        const variantId = order.first_order_item?.variant_id;
        const planType = getPlanType(variantId);

        console.log('order_created - variantId:', variantId, 'planType:', planType);

        await supabaseAdmin.from('user_subscriptions').upsert({
          user_id: userId,
          lemonsqueezy_order_id: data.id,
          lemonsqueezy_customer_id: order.customer_id,
          variant_id: String(variantId),
          plan_type: planType,
          status: 'active',
        });
        break;
      }

      case 'subscription_created': {
        // Handle subscription creation
        const subscription = data.attributes;
        const variantId = subscription.variant_id;
        const planType = getPlanType(variantId);
        const orderId = subscription.order_id;
        const customerId = subscription.customer_id;

        console.log('subscription_created - variantId:', variantId, 'planType:', planType, 'status:', subscription.status, 'orderId:', orderId);

        await supabaseAdmin.from('user_subscriptions').upsert({
          user_id: userId,
          lemonsqueezy_subscription_id: data.id,
          lemonsqueezy_order_id: orderId,
          lemonsqueezy_customer_id: customerId,
          variant_id: String(variantId),
          plan_type: planType,
          status: subscription.status === 'on_trial' ? 'active' : subscription.status,
          current_period_end: subscription.renews_at,
          trial_ends_at: subscription.trial_ends_at,
        });
        break;
      }

      case 'subscription_updated': {
        // Handle subscription updates (e.g., user cancels but still in trial/paid period)
        const subscription = data.attributes;
        
        console.log('subscription_updated - status:', subscription.status, 'ends_at:', subscription.ends_at, 'trial_ends_at:', subscription.trial_ends_at);
        
        // Get current subscription to check if it was cancelled
        const { data: currentSub } = await supabaseAdmin
          .from('user_subscriptions')
          .select('cancelled_at, plan_type')
          .eq('lemonsqueezy_subscription_id', data.id)
          .single();
        
        // Build update data
        const updateData: {
          status: string;
          current_period_end: string | null;
          trial_ends_at: string | null;
          cancelled_at?: string | null;
          plan_type?: 'free' | 'pro';
        } = {
          status: subscription.status,
          current_period_end: subscription.renews_at,
          trial_ends_at: subscription.trial_ends_at,
        };
        
        // Preserve cancelled_at if subscription is still cancelled
        // Only clear it if subscription is no longer cancelled
        if (subscription.status === 'cancelled' && currentSub?.cancelled_at) {
          // Keep existing cancelled_at timestamp
          updateData.cancelled_at = currentSub.cancelled_at;
        } else if (subscription.status !== 'cancelled') {
          // Clear cancelled_at if subscription is active again
          updateData.cancelled_at = null;
        }
        
        // Explicit payment success verification: If trial ended and subscription is now active,
        // ensure plan_type is 'pro' (trial ended successfully, payment succeeded)
        if (subscription.status === 'active' && !subscription.trial_ends_at && currentSub?.plan_type !== 'pro') {
          // Trial ended successfully, payment succeeded - explicitly set to pro
          updateData.plan_type = 'pro';
          console.log('Trial ended successfully, payment succeeded - setting plan_type to pro');
        }
        
        // Update subscription details but DON'T downgrade yet
        // User may have cancelled but still has time left in trial/paid period
        await supabaseAdmin
          .from('user_subscriptions')
          .update(updateData)
          .eq('lemonsqueezy_subscription_id', data.id);
        
        break;
      }

      case 'subscription_cancelled': {
        // User cancelled subscription but may still have access until period ends
        // DO NOT downgrade immediately - wait for subscription_expired event
        const subscription = data.attributes;
        
        console.log('subscription_cancelled - userId:', userId, 'subscription_id:', data.id);
        
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('lemonsqueezy_subscription_id', data.id);
        
        console.log('Subscription marked as cancelled, access maintained until expiration');
        break;
      }

      case 'subscription_expired': {
        // This is the definitive signal to downgrade
        // Fired when trial ends without payment OR paid period ends after cancellation
        const subscription = data.attributes;
        
        console.log('subscription_expired - userId:', userId, 'downgrading to free plan');
        
        // Check if ends_at is in the past (safety check)
        const endsAt = subscription.ends_at ? new Date(subscription.ends_at) : new Date();
        const now = new Date();
        
        if (endsAt <= now) {
          // Downgrade to free plan
          await supabaseAdmin
            .from('user_subscriptions')
            .update({
              plan_type: 'free',
              status: 'expired',
              current_period_end: null,
              trial_ends_at: null,
            })
            .eq('lemonsqueezy_subscription_id', data.id);
          
          console.log('User downgraded to free plan successfully');
        } else {
          console.log('Subscription not yet expired, keeping current plan until:', endsAt);
        }
        break;
      }

      case 'subscription_payment_failed': {
        // Payment failed - could be trial ending or regular payment
        // Mark as payment failed but don't downgrade yet
        // Wait for subscription_expired event
        console.log('subscription_payment_failed - userId:', userId, 'subscription_id:', data.id);
        
        await supabaseAdmin
          .from('user_subscriptions')
          .update({ status: 'past_due' })
          .eq('lemonsqueezy_subscription_id', data.id);
        
        console.log('Subscription marked as past_due, waiting for expiration event');
        break;
      }

      default:
        console.log('Unhandled event type:', eventType);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}
