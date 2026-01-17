// Lemon Squeezy client utilities for frontend

export const STORE_ID = import.meta.env.VITE_LEMONSQUEEZY_STORE_ID;

/**
 * Product variant IDs - Set via environment variables
 * Create products in Lemon Squeezy Dashboard and add variant IDs to .env
 */
export const PLAN_VARIANTS = {
  pro: import.meta.env.VITE_LEMONSQUEEZY_PRO_VARIANT_ID || '',
} as const;

/**
 * Plan limits configuration
 */
export const PLAN_LIMITS = {
  free: {
    scansLifetime: 2,
    name: 'Free',
    price: '$0',
  },
  pro: {
    scansPerDay: 50,
    name: 'Pro',
    price: '$2.99/mo',
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

/**
 * Initialize Lemon Squeezy overlay for SPA
 * Call this on route changes
 */
export const initLemonSqueezy = () => {
  // @ts-ignore - LemonSqueezy is loaded via script tag
  if (typeof window !== 'undefined' && window.createLemonSqueezy) {
    // @ts-ignore
    window.createLemonSqueezy();
  }
};

/**
 * Open Lemon Squeezy checkout overlay
 */
export const openCheckout = (checkoutUrl: string) => {
  // @ts-ignore - LemonSqueezy is loaded via script tag
  if (typeof window !== 'undefined' && window.LemonSqueezy) {
    // @ts-ignore
    window.LemonSqueezy.Url.Open(checkoutUrl);
  } else {
    // Fallback: open in new tab
    window.open(checkoutUrl, '_blank');
  }
};

/**
 * Check if user can perform OCR scan based on plan and usage
 */
export const canScan = (planType: PlanType, scans: number): boolean => {
  if (planType === 'free') {
    const limit = PLAN_LIMITS[planType]?.scansLifetime ?? 2;
    return scans < limit;
  }
  // Pro plan: daily limit
  const limit = PLAN_LIMITS[planType]?.scansPerDay ?? 50;
  return scans < limit;
};

/**
 * Get remaining scans
 */
export const getRemainingScans = (planType: PlanType, scans: number): number => {
  if (planType === 'free') {
    const limit = PLAN_LIMITS[planType]?.scansLifetime ?? 2;
    return Math.max(0, limit - scans);
  }
  // Pro plan: daily limit
  const limit = PLAN_LIMITS[planType]?.scansPerDay ?? 50;
  return Math.max(0, limit - scans);
};
