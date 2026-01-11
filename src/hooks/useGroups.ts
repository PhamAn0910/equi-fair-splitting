import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Group {
  id: string;
  name: string;
  currency: string | null;
  created_at: string | null;
  created_by: string;
}

export function useGroups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const groupsQuery = useQuery({
    queryKey: ['groups', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Group[];
    },
    enabled: !!user,
  });

  const createGroup = useMutation({
    mutationFn: async ({ name, currency }: { name: string; currency?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('groups')
        .insert({
          name,
          currency: currency || 'USD',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Group created!');
    },
    onError: (error) => {
      toast.error('Failed to create group: ' + error.message);
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Group deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete group: ' + error.message);
    },
  });

  return {
    groups: groupsQuery.data || [],
    isLoading: groupsQuery.isLoading,
    error: groupsQuery.error,
    createGroup: createGroup.mutate,
    deleteGroup: deleteGroup.mutate,
    isCreating: createGroup.isPending,
    isDeleting: deleteGroup.isPending,
  };
}
