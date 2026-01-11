import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SplitMethod = 'equal' | 'shares' | 'percentage' | 'amounts';

export interface ExpenseSplit {
  memberId: string;
  value: number; // shares count, percentage, or fixed amount depending on method
  calculatedAmount: number; // final calculated amount
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
  items?: ExpenseItem[]; // Optional: for OCR scanned receipts
  receiptImageUrl?: string;
  category: 'food' | 'transport' | 'drinks' | 'shopping' | 'entertainment' | 'accommodation' | 'other';
}

interface ExpenseState {
  expenses: Expense[];
  
  // Actions
  addExpense: (expense: Omit<Expense, 'id'>) => Expense;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => void;
  deleteExpense: (expenseId: string) => void;
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

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],
      
      addExpense: (expenseData) => {
        const expense: Expense = {
          ...expenseData,
          id: crypto.randomUUID(),
        };
        
        set(state => ({
          expenses: [...state.expenses, expense],
        }));
        
        return expense;
      },
      
      updateExpense: (expenseId, updates) => set(state => ({
        expenses: state.expenses.map(e =>
          e.id === expenseId ? { ...e, ...updates } : e
        ),
      })),
      
      deleteExpense: (expenseId) => set(state => ({
        expenses: state.expenses.filter(e => e.id !== expenseId),
      })),
      
      getExpensesByGroup: (groupId) => {
        return get().expenses
          .filter(e => e.groupId === groupId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },
      
      getMemberBalance: (groupId, memberId) => {
        const expenses = get().getExpensesByGroup(groupId);
        let balance = 0;
        
        for (const expense of expenses) {
          // If member paid, add the total amount
          if (expense.payerId === memberId) {
            balance += expense.totalAmount;
          }
          
          // Subtract their share
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
          // Payer gets credited
          balances[expense.payerId] = (balances[expense.payerId] || 0) + expense.totalAmount;
          
          // Each member gets debited
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
    }),
    {
      name: 'billpaint-expenses',
    }
  )
);
