import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Zap, Sparkles } from 'lucide-react';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentScans: number;
  planType: 'free' | 'pro';
  isLifetimeScans?: boolean;
}

// Replace these with your actual Lemon Squeezy variant IDs after creating products
const plans = [
  {
    id: 'pro',
    name: 'Pro',
    price: '$2.99',
    variantId: import.meta.env.VITE_LEMONSQUEEZY_PRO_VARIANT_ID || '',
    features: ['50 scans/day', '3-day free trial', 'Priority support', 'Expense analytics'],
    popular: true,
  },
];

export function UpgradeDialog({
  open,
  onOpenChange,
  currentScans,
  planType,
  isLifetimeScans = false,
}: UpgradeDialogProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (variantId: string, planId: string) => {
    if (!user) return;

    setIsLoading(planId);

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

      if (!response.ok) {
        throw new Error('Failed to create checkout');
      }

      const { checkoutUrl } = await response.json();

      // Open Lemon Squeezy overlay
      // @ts-expect-error - LemonSqueezy global from script
      if (window.LemonSqueezy) {
        // @ts-expect-error
        window.LemonSqueezy.Url.Open(checkoutUrl);
      } else {
        // Fallback: open in new tab
        window.open(checkoutUrl, '_blank');
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const maxScans = planType === 'free' ? 2 : 50;
  const scanPeriod = isLifetimeScans ? 'lifetime' : 'today';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Unlock more scans and premium features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current usage */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              You've used{' '}
              <span className="font-bold text-foreground">
                {currentScans}/{maxScans}
              </span>{' '}
              scans {scanPeriod}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {planType === 'free' 
                ? 'Get 3-day free trial with Pro subscription' 
                : 'Resets at midnight'} • Current plan:{' '}
              <span className="capitalize font-medium">{planType}</span>
            </p>
          </div>

          {/* Plan options */}
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative border rounded-xl p-4 transition-colors ${
                plan.popular
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    {plan.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  </p>
                </div>
                <Zap
                  className={`w-5 h-5 ${
                    plan.popular ? 'text-primary' : 'text-amber-500'
                  }`}
                />
              </div>

              <ul className="space-y-2 mb-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.variantId, plan.id)}
                disabled={isLoading !== null || planType === plan.id || !plan.variantId}
                variant={plan.popular ? 'default' : 'outline'}
                className="w-full"
              >
                {isLoading === plan.id
                  ? 'Loading...'
                  : planType === plan.id
                  ? 'Current Plan'
                  : !plan.variantId
                  ? 'Coming Soon'
                  : planType === 'free'
                  ? 'Start 3-Day Free Trial'
                  : `Upgrade to ${plan.name}`}
              </Button>
            </div>
          ))}

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Lemon Squeezy. Cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
