import { create } from 'zustand';
import { createSupabaseClient } from '@/lib/supabase/client';

type PlanType = 'free' | 'pro';

interface Subscription {
  planType: PlanType;
  status: string;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelledAt: string | null;
}

interface SubscriptionStore {
  subscription: Subscription | null;
  todayScans: number;
  lifetimeScans: number;
  isLoading: boolean;

  fetchSubscription: (
    userId: string,
    getToken: (options?: { template?: string }) => Promise<string | null>
  ) => Promise<void>;
  getTodayScans: (
    userId: string,
    getToken: (options?: { template?: string }) => Promise<string | null>
  ) => Promise<number>;
  getLifetimeScans: (
    userId: string,
    getToken: (options?: { template?: string }) => Promise<string | null>
  ) => Promise<number>;
  incrementScan: (
    userId: string,
    getToken: (options?: { template?: string }) => Promise<string | null>
  ) => Promise<boolean>;
  canScan: () => boolean;
  getRemainingScans: () => number;
  reset: () => void;
}

const PLAN_LIMITS = {
  free: 2, // lifetime scans
  pro: 50, // per day
};

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscription: null,
  todayScans: 0,
  lifetimeScans: 0,
  isLoading: false,

  fetchSubscription: async (userId, getToken) => {
    set({ isLoading: true });

    try {
      const supabase = await createSupabaseClient(getToken);

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found (new user)
        console.error('Error fetching subscription:', error);
      }

      if (data) {
        set({
          subscription: {
            planType: data.plan_type || 'free',
            status: data.status || 'active',
            currentPeriodEnd: data.current_period_end,
            trialEndsAt: data.trial_ends_at,
            cancelledAt: data.cancelled_at,
          },
        });
      } else {
        // Default to free plan for new users
        set({
          subscription: {
            planType: 'free',
            status: 'active',
            currentPeriodEnd: null,
            trialEndsAt: null,
            cancelledAt: null,
          },
        });
      }
    } catch (error) {
      console.error('Error in fetchSubscription:', error);
      // Default to free on error
      set({
        subscription: {
          planType: 'free',
          status: 'active',
          currentPeriodEnd: null,
          trialEndsAt: null,
          cancelledAt: null,
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  getTodayScans: async (userId, getToken) => {
    try {
      const supabase = await createSupabaseClient(getToken);
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('ocr_usage')
        .select('scan_count')
        .eq('user_id', userId)
        .eq('scan_date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching scan count:', error);
      }

      const count = data?.scan_count || 0;
      set({ todayScans: count });
      return count;
    } catch (error) {
      console.error('Error in getTodayScans:', error);
      return 0;
    }
  },

  getLifetimeScans: async (userId, getToken) => {
    try {
      const supabase = await createSupabaseClient(getToken);

      const { data, error } = await supabase
        .from('ocr_usage')
        .select('scan_count')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching lifetime scan count:', error);
        return 0;
      }

      const totalScans = data?.reduce((sum, record) => sum + (record.scan_count || 0), 0) || 0;
      set({ lifetimeScans: totalScans });
      return totalScans;
    } catch (error) {
      console.error('Error in getLifetimeScans:', error);
      return 0;
    }
  },

  incrementScan: async (userId, getToken) => {
    try {
      const supabase = await createSupabaseClient(getToken);
      const today = new Date().toISOString().split('T')[0];

      // Upsert the scan count for today
      const { error } = await supabase.from('ocr_usage').upsert(
        {
          user_id: userId,
          scan_date: today,
          scan_count: get().todayScans + 1,
        },
        {
          onConflict: 'user_id,scan_date',
        }
      );

      if (error) {
        console.error('Error incrementing scan:', error);
        return false;
      }

      set({ todayScans: get().todayScans + 1 });
      return true;
    } catch (error) {
      console.error('Error in incrementScan:', error);
      return false;
    }
  },

  canScan: () => {
    const { subscription, todayScans, lifetimeScans } = get();
    const planType = subscription?.planType || 'free';

    if (planType === 'free') {
      return lifetimeScans < PLAN_LIMITS[planType];
    }
    // Pro plan: check daily scans
    return todayScans < PLAN_LIMITS[planType];
  },

  getRemainingScans: () => {
    const { subscription, todayScans, lifetimeScans } = get();
    const planType = subscription?.planType || 'free';

    if (planType === 'free') {
      return Math.max(0, PLAN_LIMITS[planType] - lifetimeScans);
    }
    // Pro plan: daily limit
    return Math.max(0, PLAN_LIMITS[planType] - todayScans);
  },

  reset: () => {
    set({
      subscription: null,
      todayScans: 0,
      lifetimeScans: 0,
      isLoading: false,
    });
  },
}));
