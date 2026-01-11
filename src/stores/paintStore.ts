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

export interface ExpenseFees {
  tax: number;
  tip: number;
  service_charge: number;
  discount: number;
}

export interface Assignment {
  itemId: string;
  memberIds: string[];
  shareFraction: number;
}

export interface MemberBreakdown {
  itemsTotal: number;
  taxShare: number;
  tipShare: number;
  serviceShare: number;
  discountShare: number;
  grandTotal: number;
}

interface PaintState {
  // Members
  members: Member[];
  activeMemberId: string | null;
  
  // Items from receipt
  items: ExpenseItem[];
  
  // Fees (tax, tip, service charge, discount)
  fees: ExpenseFees;
  subtotal: number;
  
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
  setReceiptData: (data: { items: ExpenseItem[]; fees: ExpenseFees; subtotal: number }) => void;
  addItem: (item: ExpenseItem) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<ExpenseItem>) => void;
  updateFees: (fees: Partial<ExpenseFees>) => void;
  
  toggleAssignment: (itemId: string, memberId: string) => void;
  clearAssignment: (itemId: string) => void;
  
  setExpenseDescription: (desc: string) => void;
  setPayer: (memberId: string) => void;
  
  // Calculations
  getItemAssignees: (itemId: string) => Member[];
  getMemberItemsTotal: (memberId: string) => number;
  getMemberBreakdown: (memberId: string) => MemberBreakdown;
  getUnassignedTotal: () => number;
  getBillTotal: () => number;
  getItemsSubtotal: () => number;
  getTotalFees: () => number;
  
  // Reset
  reset: () => void;
}

const initialState = {
  members: [],
  activeMemberId: null,
  items: [],
  fees: { tax: 0, tip: 0, service_charge: 0, discount: 0 },
  subtotal: 0,
  assignments: {},
  expenseDescription: '',
  payerId: null,
};

/**
 * Distributes an amount proportionally with proper rounding.
 * Assigns rounding remainder to the largest share holder.
 */
function distributeProportionally(
  total: number,
  shares: { id: string; weight: number }[]
): Record<string, number> {
  const totalWeight = shares.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return {};

  const result: Record<string, number> = {};
  let distributed = 0;

  // Calculate raw amounts and round down
  const rawAmounts = shares.map(s => ({
    id: s.id,
    weight: s.weight,
    raw: total * (s.weight / totalWeight),
    rounded: Math.floor(total * (s.weight / totalWeight) * 100) / 100
  }));

  // Sum up rounded amounts
  for (const item of rawAmounts) {
    result[item.id] = item.rounded;
    distributed += item.rounded;
  }

  // Calculate remainder (due to rounding)
  const remainder = Math.round((total - distributed) * 100) / 100;

  // Assign remainder to the person with the largest share
  if (remainder !== 0 && rawAmounts.length > 0) {
    const largestShareHolder = rawAmounts.reduce((max, item) => 
      item.weight > max.weight ? item : max
    );
    result[largestShareHolder.id] = Math.round((result[largestShareHolder.id] + remainder) * 100) / 100;
  }

  return result;
}

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
  
  setReceiptData: (data) => set({ 
    items: data.items, 
    fees: data.fees, 
    subtotal: data.subtotal,
    assignments: {} 
  }),
  
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

  updateFees: (feeUpdates) => set((state) => ({
    fees: { ...state.fees, ...feeUpdates }
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
  
  getMemberItemsTotal: (memberId) => {
    const state = get();
    let total = 0;
    
    for (const item of state.items) {
      const assignees = state.assignments[item.id] || [];
      if (assignees.includes(memberId)) {
        total += (item.price * item.quantity) / assignees.length;
      }
    }
    
    return Math.round(total * 100) / 100;
  },

  getMemberBreakdown: (memberId) => {
    const state = get();
    const itemsTotal = get().getMemberItemsTotal(memberId);
    const billSubtotal = get().getItemsSubtotal();
    
    if (billSubtotal === 0) {
      return { itemsTotal: 0, taxShare: 0, tipShare: 0, serviceShare: 0, discountShare: 0, grandTotal: 0 };
    }

    // Calculate each member's weight (their proportion of the bill)
    const memberWeights: { id: string; weight: number }[] = [];
    for (const member of state.members) {
      const memberItems = get().getMemberItemsTotal(member.id);
      if (memberItems > 0) {
        memberWeights.push({ id: member.id, weight: memberItems });
      }
    }

    // Distribute each fee proportionally
    const taxDistribution = distributeProportionally(state.fees.tax, memberWeights);
    const tipDistribution = distributeProportionally(state.fees.tip, memberWeights);
    const serviceDistribution = distributeProportionally(state.fees.service_charge, memberWeights);
    const discountDistribution = distributeProportionally(state.fees.discount, memberWeights);

    const taxShare = taxDistribution[memberId] || 0;
    const tipShare = tipDistribution[memberId] || 0;
    const serviceShare = serviceDistribution[memberId] || 0;
    const discountShare = discountDistribution[memberId] || 0;

    const grandTotal = Math.round((itemsTotal + taxShare + tipShare + serviceShare - discountShare) * 100) / 100;

    return {
      itemsTotal,
      taxShare,
      tipShare,
      serviceShare,
      discountShare,
      grandTotal
    };
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
    
    return Math.round(unassigned * 100) / 100;
  },

  getItemsSubtotal: () => {
    const state = get();
    return Math.round(
      state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 100
    ) / 100;
  },

  getTotalFees: () => {
    const state = get();
    const { tax, tip, service_charge, discount } = state.fees;
    return Math.round((tax + tip + service_charge - discount) * 100) / 100;
  },
  
  getBillTotal: () => {
    const state = get();
    const itemsTotal = get().getItemsSubtotal();
    const feesTotal = get().getTotalFees();
    return Math.round((itemsTotal + feesTotal) * 100) / 100;
  },
  
  reset: () => set(initialState),
}));
