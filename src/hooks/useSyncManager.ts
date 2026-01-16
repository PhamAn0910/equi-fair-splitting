import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useGroupStore } from '@/stores/groupStore';
import { useExpenseStore } from '@/stores/expenseStore';

/**
 * SyncManager Hook
 * Initializes Supabase real-time sync for both stores
 * 
 * Usage: Call this hook once in your main authenticated layout/page
 */
export function useSyncManager() {
  const { getToken, userId, isSignedIn } = useAuth();
  const hasInitialized = useRef(false);
  
  const groupStore = useGroupStore();
  const expenseStore = useExpenseStore();

  useEffect(() => {
    if (!isSignedIn || !userId || hasInitialized.current) return;

    const initializeStores = async () => {
      try {
        // Get Clerk token for Supabase
        const token = await getToken({ template: 'supabase' });
        if (!token) {
          console.error('Failed to get Supabase token from Clerk');
          return;
        }

        hasInitialized.current = true;

        // Initialize group store (fetches groups + sets up realtime)
        await groupStore.initialize(token, userId);

        // Get group IDs and initialize expense store
        const groupIds = useGroupStore.getState().groups.map(g => g.id);
        await expenseStore.initialize(token, groupIds);

        console.log('✅ Stores initialized with real-time sync');

      } catch (error) {
        console.error('Failed to initialize stores:', error);
        hasInitialized.current = false;
      }
    };

    initializeStores();

    // Cleanup on unmount or sign out
    return () => {
      if (!isSignedIn) {
        groupStore.cleanup();
        expenseStore.cleanup();
        hasInitialized.current = false;
      }
    };
  }, [isSignedIn, userId, getToken]);

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
