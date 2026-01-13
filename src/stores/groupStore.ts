import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MEMBER_COLORS, getNextColor, GROUP_COLORS } from '@/lib/constants';

export interface GroupMember {
  id: string;
  name: string;
  color: string;
  colorHex: string;
  isAdmin: boolean;
}

export interface Group {
  id: string;
  name: string;
  currency: string;
  members: GroupMember[];
  createdAt: string;
  totalSpend: number;
  yourBalance: number;
  colorIndex: number; // Index into GROUP_COLORS for unique group background
}

interface GroupState {
  groups: Group[];
  activeGroupId: string | null;
  
  // Actions
  createGroup: (name: string, currency?: string, adminName?: string) => Group;
  updateGroup: (groupId: string, updates: Partial<Pick<Group, 'name' | 'currency'>>) => void;
  deleteGroup: (groupId: string) => void;
  setActiveGroup: (groupId: string | null) => void;
  getActiveGroup: () => Group | undefined;
  
  // Member actions
  addMember: (groupId: string, name: string) => GroupMember;
  removeMember: (groupId: string, memberId: string) => void;
  updateMember: (groupId: string, memberId: string, updates: Partial<GroupMember>) => void;
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      groups: [],
      activeGroupId: null,
      
      createGroup: (name, currency = 'EUR', adminName = 'You') => {
        const state = get();
        const firstColor = MEMBER_COLORS[0];
        const adminMember: GroupMember = {
          id: crypto.randomUUID(),
          name: adminName,
          color: firstColor.name,
          colorHex: firstColor.hex,
          isAdmin: true,
        };
        
        // Assign next color index based on existing group count
        const colorIndex = state.groups.length % GROUP_COLORS.length;
        
        const newGroup: Group = {
          id: crypto.randomUUID(),
          name,
          currency,
          members: [adminMember],
          createdAt: new Date().toISOString(),
          totalSpend: 0,
          yourBalance: 0,
          colorIndex,
        };
        
        set({
          groups: [...state.groups, newGroup],
          activeGroupId: newGroup.id,
        });
        
        return newGroup;
      },
      
      updateGroup: (groupId, updates) => set((state) => ({
        groups: state.groups.map(g => 
          g.id === groupId ? { ...g, ...updates } : g
        ),
      })),
      
      deleteGroup: (groupId) => set((state) => ({
        groups: state.groups.filter(g => g.id !== groupId),
        activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId,
      })),
      
      setActiveGroup: (groupId) => set({ activeGroupId: groupId }),
      
      getActiveGroup: () => {
        const state = get();
        return state.groups.find(g => g.id === state.activeGroupId);
      },
      
      addMember: (groupId, name) => {
        const state = get();
        const group = state.groups.find(g => g.id === groupId);
        
        if (!group) throw new Error('Group not found');
        
        const usedColors = group.members.map(m => m.color);
        const nextColor = getNextColor(usedColors);
        
        const newMember: GroupMember = {
          id: crypto.randomUUID(),
          name,
          color: nextColor.name,
          colorHex: nextColor.hex,
          isAdmin: false,
        };
        
        set((state) => ({
          groups: state.groups.map(g => 
            g.id === groupId 
              ? { ...g, members: [...g.members, newMember] }
              : g
          ),
        }));
        
        return newMember;
      },
      
      removeMember: (groupId, memberId) => set((state) => ({
        groups: state.groups.map(g => 
          g.id === groupId 
            ? { ...g, members: g.members.filter(m => m.id !== memberId) }
            : g
        ),
      })),
      
      updateMember: (groupId, memberId, updates) => set((state) => ({
        groups: state.groups.map(g => 
          g.id === groupId 
            ? { 
                ...g, 
                members: g.members.map(m => 
                  m.id === memberId ? { ...m, ...updates } : m
                ) 
              }
            : g
        ),
      })),
    }),
    {
      name: 'billpaint-groups',
    }
  )
);
