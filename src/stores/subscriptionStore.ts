import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

import { PLAN_LIMITS } from '@/lib/constants';

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
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
            .maybeSingle();

          if (error) {
            console.error('Error fetching subscription:', error);
          }

          if (data) {
            // Calculate effective plan type based on status and dates
            let planType = (data.plan_type || 'free') as PlanType;
            const status = data.status || 'active';
            const now = new Date();
            const currentPeriodEnd = data.current_period_end ? new Date(data.current_period_end) : null;
            const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;

            // Downgrade to free if subscription is expired/cancelled and period has ended
            if (planType === 'pro') {
              if (status === 'expired') {
                planType = 'free';
              } else if (status === 'cancelled' && currentPeriodEnd && currentPeriodEnd < now) {
                planType = 'free';
              } else if (status === 'on_trial' && trialEndsAt && trialEndsAt < now) {
                planType = 'free';
                // Also update status to show trial ended if we strictly want to be accurate, 
                // but for access control 'planType' is the key.
              }
            }

            set({
              subscription: {
                planType,
                status,
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
            .maybeSingle();

          if (error) {
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

          // Use the atomic SECURITY DEFINER RPC function instead of a manual upsert.
          // This eliminates the race condition where concurrent requests could both
          // pass the canScan() check before either increments.
          const { error } = await supabase.rpc('increment_scan_count', {
            p_user_id: userId,
          });

          if (error) {
            console.error('Error incrementing scan via RPC:', error);
            return false;
          }

          // Refresh actual counts from the database rather than optimistically
          // updating local state (the caller in ScanPaint.tsx already refreshes
          // via getTodayScans/getLifetimeScans after this call).
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
    }),
    {
      name: 'subscription-storage',
      partialize: (state) => ({
        subscription: state.subscription,
        todayScans: state.todayScans,
        lifetimeScans: state.lifetimeScans,
      }),
    }
  )
);
