import { create } from 'zustand';

export interface Member {
  id: string;
  name: string;
  color: string;
  colorHex: string;
  isAdmin: boolean;
}

export interface ExpenseItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Assignment {
  itemId: string;
  memberIds: string[];
  shareFraction: number;
}

interface PaintState {
  // Members
  members: Member[];
  activeMemberId: string | null;
  
  // Items from receipt
  items: ExpenseItem[];
  
  // Assignments map: itemId -> memberIds
  assignments: Record<string, string[]>;
  
  // Current expense info
  expenseDescription: string;
  payerId: string | null;
  
  // Actions
  setActiveMember: (memberId: string | null) => void;
  addMember: (member: Member) => void;
  removeMember: (memberId: string) => void;
  
  setItems: (items: ExpenseItem[]) => void;
  addItem: (item: ExpenseItem) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<ExpenseItem>) => void;
  
  toggleAssignment: (itemId: string, memberId: string) => void;
  clearAssignment: (itemId: string) => void;
  
  setExpenseDescription: (desc: string) => void;
  setPayer: (memberId: string) => void;
  
  // Calculations
  getItemAssignees: (itemId: string) => Member[];
  getMemberTotal: (memberId: string) => number;
  getUnassignedTotal: () => number;
  getBillTotal: () => number;
  
  // Reset
  reset: () => void;
}

const initialState = {
  members: [],
  activeMemberId: null,
  items: [],
  assignments: {},
  expenseDescription: '',
  payerId: null,
};

export const usePaintStore = create<PaintState>((set, get) => ({
  ...initialState,
  
  setActiveMember: (memberId) => set({ activeMemberId: memberId }),
  
  addMember: (member) => set((state) => ({
    members: [...state.members, member],
  })),
  
  removeMember: (memberId) => set((state) => ({
    members: state.members.filter(m => m.id !== memberId),
    activeMemberId: state.activeMemberId === memberId ? null : state.activeMemberId,
    assignments: Object.fromEntries(
      Object.entries(state.assignments).map(([itemId, memberIds]) => [
        itemId,
        memberIds.filter(id => id !== memberId),
      ])
    ),
  })),
  
  setItems: (items) => set({ items, assignments: {} }),
  
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
  })),
  
  removeItem: (itemId) => set((state) => ({
    items: state.items.filter(i => i.id !== itemId),
    assignments: Object.fromEntries(
      Object.entries(state.assignments).filter(([id]) => id !== itemId)
    ),
  })),
  
  updateItem: (itemId, updates) => set((state) => ({
    items: state.items.map(i => i.id === itemId ? { ...i, ...updates } : i),
  })),
  
  toggleAssignment: (itemId, memberId) => set((state) => {
    const current = state.assignments[itemId] || [];
    const isAssigned = current.includes(memberId);
    
    return {
      assignments: {
        ...state.assignments,
        [itemId]: isAssigned
          ? current.filter(id => id !== memberId)
          : [...current, memberId],
      },
    };
  }),
  
  clearAssignment: (itemId) => set((state) => ({
    assignments: {
      ...state.assignments,
      [itemId]: [],
    },
  })),
  
  setExpenseDescription: (desc) => set({ expenseDescription: desc }),
  
  setPayer: (memberId) => set({ payerId: memberId }),
  
  getItemAssignees: (itemId) => {
    const state = get();
    const memberIds = state.assignments[itemId] || [];
    return state.members.filter(m => memberIds.includes(m.id));
  },
  
  getMemberTotal: (memberId) => {
    const state = get();
    let total = 0;
    
    for (const item of state.items) {
      const assignees = state.assignments[item.id] || [];
      if (assignees.includes(memberId)) {
        // Split equally among all assignees
        total += (item.price * item.quantity) / assignees.length;
      }
    }
    
    return total;
  },
  
  getUnassignedTotal: () => {
    const state = get();
    let unassigned = 0;
    
    for (const item of state.items) {
      const assignees = state.assignments[item.id] || [];
      if (assignees.length === 0) {
        unassigned += item.price * item.quantity;
      }
    }
    
    return unassigned;
  },
  
  getBillTotal: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },
  
  reset: () => set(initialState),
}));
