import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { MEMBER_COLORS, GROUP_COLORS, getNextColor } from '@/lib/constants';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  colorIndex: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientType = ReturnType<typeof createClient<any>>;

// Type for the getToken function from Clerk
type GetTokenFn = () => Promise<string | null>;

interface GroupState {
  groups: Group[];
  activeGroupId: string | null;
  isLoading: boolean;
  error: string | null;

  // Auth
  supabase: SupabaseClientType | null;
  userId: string | null;
  realtimeChannel: RealtimeChannel | null;
  getToken: GetTokenFn | null;

  // Init & Cleanup
  initialize: (getToken: GetTokenFn, userId: string) => Promise<void>;
  cleanup: () => void;

  // Data fetching
  fetchGroups: () => Promise<void>;

  // Actions
  createGroup: (name: string, currency?: string, adminName?: string) => Promise<Group | null>;
  updateGroup: (groupId: string, updates: Partial<Pick<Group, 'name' | 'currency' | 'colorIndex'>>) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  setActiveGroup: (groupId: string | null) => void;
  getActiveGroup: () => Group | undefined;
  setGroups: (groups: Group[]) => void;

  // Member actions
  addMember: (groupId: string, memberData: { name: string; colorHex?: string; isAdmin?: boolean }) => Promise<GroupMember | null>;
  removeMember: (groupId: string, memberId: string) => Promise<boolean>;
  updateMember: (groupId: string, memberId: string, updates: Partial<GroupMember>) => Promise<boolean>;
}





export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      groups: [],
      activeGroupId: null,
      isLoading: false,
      error: null,
      supabase: null,
      userId: null,
      realtimeChannel: null,
      getToken: null,

      initialize: async (getToken: GetTokenFn, userId: string) => {
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

        set({ supabase, userId, getToken, isLoading: true });

        // Fetch initial data
        await get().fetchGroups();

        // Subscribe to real-time changes
        const channel = supabase
          .channel('groups-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'groups', filter: `user_id=eq.${userId}` },
            () => {
              // Refetch on any change
              get().fetchGroups();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'members' },
            () => {
              // Refetch groups when members change
              get().fetchGroups();
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
        set({ supabase: null, userId: null, realtimeChannel: null, getToken: null, groups: [] });
      },

      fetchGroups: async () => {
        const { supabase, userId, activeGroupId } = get();
        if (!supabase || !userId) return;

        try {
          const { data, error } = await supabase
            .from('groups')
            .select(`
          id,
          user_id,
          name,
          currency,
          color_index,
          created_at,
          members (
            id,
            name,
            color_hex,
            is_admin
          )
        `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;

          const groups: Group[] = (data || []).map((g: any) => ({
            id: g.id,
            name: g.name,
            currency: g.currency || 'EUR',
            colorIndex: g.color_index || 0,
            createdAt: g.created_at,
            totalSpend: 0,
            yourBalance: 0,
            members: (g.members || []).map((m: any) => ({
              id: m.id,
              name: m.name,
              color: m.color_hex?.replace('#', '') || 'sage',
              colorHex: m.color_hex || '#6B7B5F',
              isAdmin: m.is_admin || false,
            })),
          }));

          // Logic to auto-select a group if none is active or current active is not in list
          let newActiveGroupId = activeGroupId;
          if (groups.length > 0) {
            const isActiveGroupValid = groups.some(g => g.id === activeGroupId);
            if (!activeGroupId || !isActiveGroupValid) {
              newActiveGroupId = groups[0].id;
            }
          } else {
            newActiveGroupId = null;
          }

          set({ groups, activeGroupId: newActiveGroupId, error: null });
        } catch (err: any) {
          console.error('Failed to fetch groups:', err);
          set({ error: err.message });
        }
      },

      setGroups: (groups) => set({ groups }),

      createGroup: async (name, currency = 'EUR', adminName = 'You') => {
        const { supabase, userId, groups } = get();
        if (!supabase || !userId) {
          set({ error: 'Not authenticated' });
          return null;
        }

        const colorIndex = groups.length % GROUP_COLORS.length;
        const firstColor = MEMBER_COLORS[0];

        try {
          // Insert group
          const { data: newGroup, error: groupError } = await supabase
            .from('groups')
            .insert({
              user_id: userId,
              name,
              currency,
              color_index: colorIndex,
            })
            .select()
            .single();

          if (groupError) throw groupError;

          // Insert admin member
          const { data: adminMember, error: memberError } = await supabase
            .from('members')
            .insert({
              group_id: newGroup.id,
              name: adminName,
              color_hex: firstColor.hex,
              is_admin: true,
            })
            .select()
            .single();

          if (memberError) throw memberError;

          const group: Group = {
            id: newGroup.id,
            name,
            currency,
            colorIndex,
            createdAt: newGroup.created_at,
            totalSpend: 0,
            yourBalance: 0,
            members: [{
              id: adminMember.id,
              name: adminName,
              color: firstColor.name,
              colorHex: firstColor.hex,
              isAdmin: true,
            }],
          };

          // Optimistic update (realtime will also update)
          set({ groups: [...groups, group], activeGroupId: group.id });
          return group;

        } catch (err: any) {
          console.error('Failed to create group:', err);
          set({ error: err.message });
          return null;
        }
      },

      updateGroup: async (groupId, updates) => {
        const { supabase, groups } = get();
        if (!supabase) return false;

        // Optimistic update
        const previousGroups = [...groups];
        set({
          groups: groups.map(g => g.id === groupId ? { ...g, ...updates } : g),
        });

        try {
          const dbUpdates: Record<string, any> = {};
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
          if (updates.colorIndex !== undefined) dbUpdates.color_index = updates.colorIndex;

          const { error } = await supabase
            .from('groups')
            .update(dbUpdates)
            .eq('id', groupId);

          if (error) throw error;
          return true;

        } catch (err: any) {
          console.error('Failed to update group:', err);
          // Rollback
          set({ groups: previousGroups, error: err.message });
          return false;
        }
      },

      deleteGroup: async (groupId) => {
        const { supabase, groups, activeGroupId } = get();
        if (!supabase) return false;

        // Optimistic update
        const previousGroups = [...groups];
        const newGroups = groups.filter(g => g.id !== groupId);

        // If deleting active group, switch to another one if possible
        let newActiveGroupId = activeGroupId;
        if (activeGroupId === groupId) {
          newActiveGroupId = newGroups.length > 0 ? newGroups[0].id : null;
        }

        set({
          groups: newGroups,
          activeGroupId: newActiveGroupId,
        });

        try {
          const { error } = await supabase
            .from('groups')
            .delete()
            .eq('id', groupId);

          if (error) throw error;
          return true;

        } catch (err: any) {
          console.error('Failed to delete group:', err);
          // Rollback
          set({ groups: previousGroups, activeGroupId: activeGroupId, error: err.message });
          return false;
        }
      },

      setActiveGroup: (groupId) => set({ activeGroupId: groupId }),

      getActiveGroup: () => {
        const { groups, activeGroupId } = get();
        return groups.find(g => g.id === activeGroupId);
      },

      addMember: async (groupId, memberData) => {
        const { supabase, groups } = get();
        if (!supabase) return null;

        const group = groups.find(g => g.id === groupId);
        if (!group) return null;

        const usedColors = group.members.map(m => m.color);
        const nextColor = getNextColor(usedColors);
        const colorHex = memberData.colorHex || nextColor.hex;

        try {
          const { data: newMember, error } = await supabase
            .from('members')
            .insert({
              group_id: groupId,
              name: memberData.name,
              color_hex: colorHex,
              is_admin: memberData.isAdmin || false,
            })
            .select()
            .single();

          if (error) throw error;

          const member: GroupMember = {
            id: newMember.id,
            name: memberData.name,
            color: nextColor.name,
            colorHex,
            isAdmin: memberData.isAdmin || false,
          };

          // Optimistic update
          set({
            groups: groups.map(g =>
              g.id === groupId ? { ...g, members: [...g.members, member] } : g
            ),
          });

          return member;

        } catch (err: any) {
          console.error('Failed to add member:', err);
          set({ error: err.message });
          return null;
        }
      },

      removeMember: async (groupId, memberId) => {
        const { supabase, groups } = get();
        if (!supabase) return false;

        // Optimistic update
        const previousGroups = [...groups];
        set({
          groups: groups.map(g =>
            g.id === groupId
              ? { ...g, members: g.members.filter(m => m.id !== memberId) }
              : g
          ),
        });

        try {
          const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', memberId);

          if (error) throw error;
          return true;

        } catch (err: any) {
          console.error('Failed to remove member:', err);
          // Rollback
          set({ groups: previousGroups, error: err.message });
          return false;
        }
      },

      updateMember: async (groupId, memberId, updates) => {
        const { supabase, groups } = get();
        if (!supabase) return false;

        // Optimistic update
        const previousGroups = [...groups];
        set({
          groups: groups.map(g =>
            g.id === groupId
              ? {
                ...g,
                members: g.members.map(m =>
                  m.id === memberId ? { ...m, ...updates } : m
                ),
              }
              : g
          ),
        });

        try {
          const dbUpdates: Record<string, any> = {};
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.colorHex !== undefined) dbUpdates.color_hex = updates.colorHex;
          if (updates.isAdmin !== undefined) dbUpdates.is_admin = updates.isAdmin;

          const { error } = await supabase
            .from('members')
            .update(dbUpdates)
            .eq('id', memberId);

          if (error) throw error;
          return true;

        } catch (err: any) {
          console.error('Failed to update member:', err);
          // Rollback
          set({ groups: previousGroups, error: err.message });
          return false;
        }
      },
    }),
    {
      name: 'group-storage',
      partialize: (state) => ({ activeGroupId: state.activeGroupId }),
    }
  )
);
