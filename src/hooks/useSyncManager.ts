import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useGroupStore } from '@/stores/groupStore';
import { useExpenseStore } from '@/stores/expenseStore';

/**
 * SyncManager Hook
 * Initializes Supabase real-time sync for both stores
 * Uses dynamic token refresh to prevent JWT expiration issues
 * 
 * Usage: Call this hook once in your main authenticated layout/page
 */
export function useSyncManager() {
  const { getToken, userId, isSignedIn } = useAuth();
  const hasInitialized = useRef(false);
  const prevUserId = useRef<string | null>(null);
  
  const groupStore = useGroupStore();
  const expenseStore = useExpenseStore();

  // Create a stable getToken function that fetches fresh tokens
  const getSupabaseToken = useCallback(async () => {
    return getToken({ template: 'supabase' });
  }, [getToken]);

  useEffect(() => {
    // Reset initialization if user changed (sign out/sign in)
    if (prevUserId.current !== userId) {
      if (prevUserId.current !== null) {
        // User changed, cleanup old session
        groupStore.cleanup();
        expenseStore.cleanup();
        hasInitialized.current = false;
      }
      prevUserId.current = userId;
    }

    if (!isSignedIn || !userId || hasInitialized.current) return;

    const initializeStores = async () => {
      try {
        // Verify we can get a token before initializing
        const initialToken = await getSupabaseToken();
        if (!initialToken) {
          console.error('Failed to get Supabase token from Clerk');
          return;
        }

        hasInitialized.current = true;

        // Initialize group store with getToken function (not static token)
        // This allows the Supabase client to fetch fresh tokens on each request
        await groupStore.initialize(getSupabaseToken, userId);

        // Get group IDs and initialize expense store
        const groupIds = useGroupStore.getState().groups.map(g => g.id);
        await expenseStore.initialize(getSupabaseToken, groupIds);

        console.log('✅ Stores initialized with dynamic token refresh');

      } catch (error) {
        console.error('Failed to initialize stores:', error);
        hasInitialized.current = false;
      }
    };

    initializeStores();

    // Cleanup on unmount
    return () => {
      // Only cleanup if actually signing out (not just unmounting)
      if (!isSignedIn) {
        groupStore.cleanup();
        expenseStore.cleanup();
        hasInitialized.current = false;
        prevUserId.current = null;
      }
    };
  }, [isSignedIn, userId, getSupabaseToken]);

  // Re-fetch expenses when groups change
  useEffect(() => {
    const groupIds = groupStore.groups.map(g => g.id);
    if (groupIds.length > 0 && expenseStore.supabase) {
      expenseStore.fetchExpenses(groupIds);
    }
  }, [groupStore.groups.length]);

  return {
    isLoading: groupStore.isLoading || expenseStore.isLoading,
    error: groupStore.error || expenseStore.error,
    isAuthenticated: isSignedIn,
    userId,
  };
}
