# Phase 5: Lemon Squeezy Integration

**Estimated Time:** 3-4 hours

## 5.1 Lemon Squeezy Dashboard Setup

1. Go to **[Lemon Squeezy Dashboard](https://app.lemonsqueezy.com)**.
2. Navigate to **Products** in your store.
3. Create **Pro Plan**:
   - Name: "BillPainter Pro"
   - Price: $4.99 / Recurring / Monthly
   - Create a **Variant** for this plan
4. Create **Unlimited Plan**:
   - Name: "BillPainter Unlimited"
   - Price: $9.99 / Recurring / Monthly
   - Create a **Variant** for this plan
5. Copy the **Variant IDs** (e.g., `123456`, `789012`) for both plans.

## 5.2 Lemon Squeezy Webhook Handler

This is crucial. Webhooks tell your DB when a user has actually paid.

Create `api/lemonsqueezy-webhook.ts`:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { supabaseAdmin } from './_lib/supabase-admin';

// CRITICAL: Disable body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;

async function buffer(readable: any) {
  const chunks = [];
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
  
  // Extract userId from custom data
  const userId = meta.custom_data?.userId || data.attributes?.first_order_item?.custom_data?.userId;

  if (!userId) {
    console.error('No userId found in webhook payload');
    return res.status(400).send('Missing userId');
  }

  try {
    switch (eventType) {
      case 'order_created':
        // Provision access when order is created
        const order = data.attributes;
        const variantId = order.first_order_item?.variant_id;
        
        // Map variantId to plan type
        let planType = 'free';
        if (variantId === '123456') planType = 'pro'; // Replace with actual variant ID
        if (variantId === '789012') planType = 'unlimited'; // Replace with actual variant ID

        await supabaseAdmin.from('user_subscriptions').upsert({
          user_id: userId,
          lemonsqueezy_order_id: data.id,
          lemonsqueezy_customer_id: order.customer_id,
          variant_id: variantId,
          plan_type: planType,
          status: 'active',
        });
        break;

      case 'subscription_created':
        // Handle subscription creation
        const subscription = data.attributes;
        await supabaseAdmin.from('user_subscriptions').upsert({
          user_id: userId,
          lemonsqueezy_subscription_id: data.id,
          lemonsqueezy_customer_id: subscription.customer_id,
          variant_id: subscription.variant_id,
          status: subscription.status,
          current_period_end: subscription.renews_at,
        });
        break;

      case 'subscription_updated':
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
        // Optionally update status to 'past_due'
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
```

## 5.3 Configure Webhook in Lemon Squeezy

1. Go to **Settings > Webhooks** in your Lemon Squeezy store.
2. Click **Add Endpoint**.
3. Enter URL: `http://localhost:3000/api/lemonsqueezy-webhook` (for local testing).
4. Copy the **Signing Secret** and add to `.env`:
   ```bash
   LEMONSQUEEZY_WEBHOOK_SECRET=your_signing_secret_here
   ```
5. Select events to listen for:
   - `order_created`
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
   - `subscription_payment_failed`

## 5.4 Frontend: Add Lemon.js Script

Edit `index.html` to add the Lemon Squeezy overlay script:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BillPainter</title>
    
    <!-- Lemon Squeezy Overlay Script -->
    <script src="https://app.lemonsqueezy.com/js/lemon.js" defer></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## 5.5 Frontend Subscription Store

Create `src/stores/subscriptionStore.ts`:

```typescript
import { create } from 'zustand';
import { createSupabaseClient } from '@/lib/supabase/client';

interface Subscription {
  planType: 'free' | 'pro' | 'unlimited';
  status: string;
  currentPeriodEnd: string | null;
}

interface SubscriptionStore {
  subscription: Subscription | null;
  todayScans: number;
  isLoading: boolean;
  
  fetchSubscription: (userId: string, getToken: any) => Promise<void>;
  getTodayScans: (userId: string, getToken: any) => Promise<number>;
  incrementScan: (userId: string, getToken: any) => Promise<boolean>;
  canScan: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscription: null,
  todayScans: 0,
  isLoading: false,

  fetchSubscription: async (userId: string, getToken: any) => {
    set({ isLoading: true });
    const supabase = await createSupabaseClient(getToken);
    
    const { data } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (data) {
      set({
        subscription: {
          planType: data.plan_type,
          status: data.status,
          currentPeriodEnd: data.current_period_end,
        },
      });
    }
    set({ isLoading: false });
  },

  getTodayScans: async (userId: string, getToken: any) => {
    const supabase = await createSupabaseClient(getToken);
    const { data } = await supabase.rpc('get_today_scan_count', {
      p_user_id: userId,
    });
    
    const count = data || 0;
    set({ todayScans: count });
    return count;
  },

  incrementScan: async (userId: string, getToken: any) => {
    const supabase = await createSupabaseClient(getToken);
    const { error } = await supabase.rpc('increment_scan_count', {
      p_user_id: userId,
    });
    
    if (!error) {
      const newCount = get().todayScans + 1;
      set({ todayScans: newCount });
      return true;
    }
    return false;
  },

  canScan: () => {
    const { subscription, todayScans } = get();
    
    if (subscription?.planType === 'unlimited') return true;
    if (subscription?.planType === 'pro') return todayScans < 50;
    return todayScans < 2; // Free plan: 2 scans/day
  },
}));
```

## 5.6 Upgrade Dialog Component

Create `src/components/UpgradeDialog.tsx`:

```typescript
import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Zap } from 'lucide-react';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentScans: number;
  planType: 'free' | 'pro' | 'unlimited';
}

const plans = [
  {
    id: 'pro',
    name: 'Pro',
    price: '$4.99',
    variantId: '123456', // Replace with your actual Lemon Squeezy variant ID
    features: ['50 scans/day', 'Priority support', 'Advanced analytics'],
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '$9.99',
    variantId: '789012', // Replace with your actual Lemon Squeezy variant ID
    features: ['Unlimited scans', 'Priority support', 'Advanced analytics', 'API access'],
  },
];

export function UpgradeDialog({ open, onOpenChange, currentScans, planType }: UpgradeDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (variantId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/lemonsqueezy-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId,
          userId: user.id,
          email: user.emailAddresses[0]?.emailAddress,
        }),
      });
      
      const { checkoutUrl } = await response.json();
      
      // Open Lemon Squeezy overlay
      // @ts-ignore - LemonSqueezy global
      if (window.LemonSqueezy) {
        // @ts-ignore
        window.LemonSqueezy.Url.Open(checkoutUrl);
      } else {
        // Fallback: open in new tab
        window.open(checkoutUrl, '_blank');
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              You've used <span className="font-bold text-foreground">{currentScans}/2</span> free scans today
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Resets at midnight • Current plan: <span className="capitalize">{planType}</span>
            </p>
          </div>

          {plans.map((plan) => (
            <div
              key={plan.id}
              className="border border-border rounded-xl p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{plan.name}</h3>
                  <p className="text-2xl font-bold text-primary">
                    {plan.price}
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </p>
                </div>
                <Zap className="w-5 h-5 text-amber-500" />
              </div>

              <ul className="space-y-2 mb-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.variantId)}
                disabled={isLoading || planType === plan.id}
                className="w-full"
              >
                {planType === plan.id ? 'Current Plan' : `Upgrade to ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## 5.7 Initialize Lemon Squeezy on Route Changes

Add to your `App.tsx` or main layout:

```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Inside your component
const location = useLocation();

useEffect(() => {
  // Reinitialize Lemon Squeezy overlay on route changes (for SPA)
  // @ts-ignore
  if (window.createLemonSqueezy) {
    // @ts-ignore
    window.createLemonSqueezy();
  }
}, [location]);
```

## Checklist

- [ ] Lemon Squeezy Products & Variants created
- [ ] Variant IDs copied
- [ ] Webhook handler implemented
- [ ] Webhook configured in Lemon Squeezy dashboard
- [ ] Lemon.js script added to index.html
- [ ] Subscription store created
- [ ] Upgrade UI implemented
- [ ] Test checkout flow in browser
