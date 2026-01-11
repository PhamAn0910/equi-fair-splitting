import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GroupMember {
  id: string;
  name: string;
  avatar_color: string;
  is_admin: boolean | null;
  group_id: string;
  created_at: string | null;
}

export function useGroupMembers(groupId: string | undefined) {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as GroupMember[];
    },
    enabled: !!groupId,
  });

  const addMember = useMutation({
    mutationFn: async ({ 
      name, 
      avatarColor, 
      isAdmin = false 
    }: { 
      name: string; 
      avatarColor: string; 
      isAdmin?: boolean;
    }) => {
      if (!groupId) throw new Error('No group selected');

      const { data, error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          name,
          avatar_color: avatarColor,
          is_admin: isAdmin,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      toast.success('Member added!');
    },
    onError: (error) => {
      toast.error('Failed to add member: ' + error.message);
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      toast.success('Member removed');
    },
    onError: (error) => {
      toast.error('Failed to remove member: ' + error.message);
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ 
      memberId, 
      updates 
    }: { 
      memberId: string; 
      updates: Partial<{ name: string; avatar_color: string; is_admin: boolean }>;
    }) => {
      const { data, error } = await supabase
        .from('group_members')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
    },
    onError: (error) => {
      toast.error('Failed to update member: ' + error.message);
    },
  });

  return {
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    error: membersQuery.error,
    addMember: addMember.mutate,
    removeMember: removeMember.mutate,
    updateMember: updateMember.mutate,
    isAdding: addMember.isPending,
    isRemoving: removeMember.isPending,
  };
}
