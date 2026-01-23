import { create } from 'zustand';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { useGroupStore } from './groupStore';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientType = ReturnType<typeof createClient<any>>;

export type SplitMethod = 'equal' | 'shares' | 'percentage' | 'amounts';

export interface ExpenseSplit {
  memberId: string;
  value: number;
  calculatedAmount: number;
}

export interface ExpenseItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  totalAmount: number;
  currency: string;
  payerId: string;
  date: string;
  splitMethod: SplitMethod;
  splits: ExpenseSplit[];
  items?: ExpenseItem[];
  receiptImageUrl?: string;
  category: 'food' | 'transport' | 'drinks' | 'shopping' | 'entertainment' | 'accommodation' | 'other';
}

// Type for the getToken function from Clerk
type GetTokenFn = () => Promise<string | null>;

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;

  // Auth
  supabase: SupabaseClientType | null;
  realtimeChannel: RealtimeChannel | null;
  getToken: GetTokenFn | null;

  // Init & Cleanup
  initialize: (getToken: GetTokenFn, groupIds: string[]) => Promise<void>;
  cleanup: () => void;

  // Data fetching
  fetchExpenses: (groupIds: string[]) => Promise<void>;
  setExpenses: (expenses: Expense[]) => void;

  // Actions
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<Expense | null>;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => Promise<boolean>;
  deleteExpense: (expenseId: string) => Promise<boolean>;
  deleteExpensesByGroup: (groupId: string) => void;
  getExpensesByGroup: (groupId: string) => Expense[];

  // Balance calculations
  getMemberBalance: (groupId: string, memberId: string) => number;
  getGroupBalances: (groupId: string) => Record<string, number>;
  getGroupTotalSpend: (groupId: string) => number;
}

// Calculate split amounts based on method
export function calculateSplits(
  totalAmount: number,
  splits: { memberId: string; value: number }[],
  method: SplitMethod
): ExpenseSplit[] {
  if (splits.length === 0) return [];

  switch (method) {
    case 'equal': {
      const equalShare = totalAmount / splits.length;
      return splits.map(s => ({
        ...s,
        value: 1,
        calculatedAmount: equalShare,
      }));
    }

    case 'shares': {
      const totalShares = splits.reduce((sum, s) => sum + s.value, 0);
      if (totalShares === 0) return splits.map(s => ({ ...s, calculatedAmount: 0 }));

      return splits.map(s => ({
        ...s,
        calculatedAmount: (s.value / totalShares) * totalAmount,
      }));
    }

    case 'percentage': {
      return splits.map(s => ({
        ...s,
        calculatedAmount: (s.value / 100) * totalAmount,
      }));
    }

    case 'amounts': {
      return splits.map(s => ({
        ...s,
        calculatedAmount: s.value,
      }));
    }

    default:
      return splits.map(s => ({ ...s, calculatedAmount: 0 }));
  }
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: false,
  error: null,
  supabase: null,
  realtimeChannel: null,
  getToken: null,

  initialize: async (getToken: GetTokenFn, groupIds: string[]) => {
    // Create authenticated Supabase client with dynamic token refresh
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          // Set initial auth header (will be refreshed by accessToken)
          'apikey': supabaseAnonKey,
        },
      },
      accessToken: async () => {
        const token = await getToken();
        return token ?? '';
      },
    });

    set({ supabase, getToken, isLoading: true });

    // Fetch initial data
    await get().fetchExpenses(groupIds);

    // Subscribe to real-time changes for expenses
    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          const { expenses } = get();

          if (eventType === 'INSERT' && newRecord) {
            // Check if expense already exists (optimistic update)
            const exists = expenses.some(e => e.id === newRecord.id);
            if (!exists) {
              const expense = transformExpense(newRecord);
              set({ expenses: [expense, ...expenses] });
            }
          } else if (eventType === 'UPDATE' && newRecord) {
            const expense = transformExpense(newRecord);
            set({
              expenses: expenses.map(e => e.id === expense.id ? expense : e),
            });
          } else if (eventType === 'DELETE' && oldRecord) {
            set({
              expenses: expenses.filter(e => e.id !== oldRecord.id),
            });
          }
        }
      )
      .subscribe();

    set({ realtimeChannel: channel, isLoading: false });
  },

  cleanup: () => {
    const { realtimeChannel, supabase } = get();
    if (realtimeChannel) {
      supabase?.removeChannel(realtimeChannel);
    }
    set({ supabase: null, realtimeChannel: null, getToken: null, expenses: [] });
  },

  fetchExpenses: async (groupIds: string[]) => {
    const { supabase } = get();
    if (!supabase || groupIds.length === 0) {
      set({ expenses: [], isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .in('group_id', groupIds)
        .order('date', { ascending: false });

      if (error) throw error;

      const expenses = (data || []).map(transformExpense);
      set({ expenses, error: null, isLoading: false });

    } catch (err: any) {
      console.error('Failed to fetch expenses:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  setExpenses: (expenses) => set({ expenses }),

  addExpense: async (expenseData) => {
    const { supabase, expenses } = get();
    if (!supabase) {
      set({ error: 'Not authenticated' });
      return null;
    }

    // Generate temporary ID for optimistic update
    const tempId = crypto.randomUUID();
    const optimisticExpense: Expense = {
      ...expenseData,
      id: tempId,
    };

    // Optimistic update
    set({ expenses: [optimisticExpense, ...expenses] });

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          group_id: expenseData.groupId,
          description: expenseData.description,
          total_amount: expenseData.totalAmount,
          payer_id: expenseData.payerId,
          date: expenseData.date || new Date().toISOString(),
          category: expenseData.category,
          items: expenseData.items || [],
          splits: expenseData.splits,
        })
        .select()
        .single();

      if (error) throw error;

      const expense = transformExpense(data);

      // Replace temp expense with real one
      set({
        expenses: get().expenses.map(e => e.id === tempId ? expense : e),
      });

      return expense;

    } catch (err: any) {
      console.error('Failed to add expense:', err);
      // Rollback
      set({
        expenses: get().expenses.filter(e => e.id !== tempId),
        error: err.message,
      });
      return null;
    }
  },

  updateExpense: async (expenseId, updates) => {
    const { supabase, expenses } = get();
    if (!supabase) return false;

    // Optimistic update
    const previousExpenses = [...expenses];
    set({
      expenses: expenses.map(e =>
        e.id === expenseId ? { ...e, ...updates } : e
      ),
    });

    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
      if (updates.payerId !== undefined) dbUpdates.payer_id = updates.payerId;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.items !== undefined) dbUpdates.items = updates.items;
      if (updates.splits !== undefined) dbUpdates.splits = updates.splits;

      const { error } = await supabase
        .from('expenses')
        .update(dbUpdates)
        .eq('id', expenseId);

      if (error) throw error;
      return true;

    } catch (err: any) {
      console.error('Failed to update expense:', err);
      // Rollback
      set({ expenses: previousExpenses, error: err.message });
      return false;
    }
  },

  deleteExpense: async (expenseId) => {
    const { supabase, expenses } = get();
    if (!supabase) return false;

    // Optimistic update
    const previousExpenses = [...expenses];
    set({ expenses: expenses.filter(e => e.id !== expenseId) });

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
      return true;

    } catch (err: any) {
      console.error('Failed to delete expense:', err);
      // Rollback
      set({ expenses: previousExpenses, error: err.message });
      return false;
    }
  },

  deleteExpensesByGroup: (groupId) => {
    // Local only - DB cascade handles this
    set({ expenses: get().expenses.filter(e => e.groupId !== groupId) });
  },

  getExpensesByGroup: (groupId) => {
    return get().expenses
      .filter(e => e.groupId === groupId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getMemberBalance: (groupId, memberId) => {
    const expenses = get().getExpensesByGroup(groupId);
    let balance = 0;

    for (const expense of expenses) {
      if (expense.payerId === memberId) {
        balance += expense.totalAmount;
      }

      const memberSplit = expense.splits.find(s => s.memberId === memberId);
      if (memberSplit) {
        balance -= memberSplit.calculatedAmount;
      }
    }

    return balance;
  },

  getGroupBalances: (groupId) => {
    const expenses = get().getExpensesByGroup(groupId);
    const balances: Record<string, number> = {};

    for (const expense of expenses) {
      balances[expense.payerId] = (balances[expense.payerId] || 0) + expense.totalAmount;

      for (const split of expense.splits) {
        balances[split.memberId] = (balances[split.memberId] || 0) - split.calculatedAmount;
      }
    }

    return balances;
  },

  getGroupTotalSpend: (groupId) => {
    return get().getExpensesByGroup(groupId)
      .reduce((sum, e) => sum + e.totalAmount, 0);
  },
}));

// Helper to transform DB row to Expense
function transformExpense(row: any): Expense {
  return {
    id: row.id,
    groupId: row.group_id,
    description: row.description,
    totalAmount: parseFloat(row.total_amount),
    currency: 'EUR', // Default
    payerId: row.payer_id,
    date: row.date,
    splitMethod: 'amounts' as SplitMethod,
    splits: row.splits || [],
    items: row.items || [],
    category: row.category || 'other',
  };
}
