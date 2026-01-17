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
        
        console.log('subscription_created - variantId:', variantId, 'planType:', planType);
        
        await supabaseAdmin.from('user_subscriptions').upsert({
          user_id: userId,
          lemonsqueezy_subscription_id: data.id,
          lemonsqueezy_customer_id: subscription.customer_id,
          variant_id: String(variantId),
          plan_type: planType,
          status: subscription.status === 'on_trial' ? 'active' : subscription.status,
          current_period_end: subscription.renews_at,
        });
        break;
      }

      case 'subscription_updated': {
        // Update subscription status
        const updatedSub = data.attributes;
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: updatedSub.status,
            current_period_end: updatedSub.renews_at,
          })
          .eq('lemonsqueezy_subscription_id', data.id);
        break;
      }

      case 'subscription_cancelled':
        // Mark as cancelled but keep access until period ends
        await supabaseAdmin
          .from('user_subscriptions')
          .update({ status: 'cancelled' })
          .eq('lemonsqueezy_subscription_id', data.id);
        break;

      case 'subscription_expired':
        // Remove access when subscription expires
        await supabaseAdmin
          .from('user_subscriptions')
          .update({ status: 'expired', plan_type: 'free' })
          .eq('lemonsqueezy_subscription_id', data.id);
        break;

      case 'subscription_payment_failed':
        // Handle failed payment - trigger dunning email
        console.log('Payment failed for subscription:', data.id);
        await supabaseAdmin
          .from('user_subscriptions')
          .update({ status: 'past_due' })
          .eq('lemonsqueezy_subscription_id', data.id);
        break;

      default:
        console.log('Unhandled event type:', eventType);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}
