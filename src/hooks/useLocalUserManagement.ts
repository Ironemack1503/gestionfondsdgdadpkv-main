import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AppRole } from '@/types/database';
import { toAuthEmail } from '@/lib/auth';

export interface LocalUser {
  id: string;
  username: string;
  full_name: string | null;
  role: AppRole;
  is_active: boolean;
  is_locked: boolean;
  failed_login_attempts: number;
  last_login_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useLocalUserManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toAuthEmail = (username: string) => {
    const trimmed = username.trim().toLowerCase();
    return trimmed.includes('@') ? trimmed : `${trimmed}@local.test`;
  };

  // Fetch all users via local_users table
  const { data: users = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['local-users'],
    queryFn: async () => {
      const { data: localUsers, error } = await supabase
        .from('local_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (localUsers || []).map(user => ({
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role as AppRole,
        is_active: user.is_active,
        is_locked: false, // local_users doesn't have this field
        failed_login_attempts: 0, // not tracked in local_users
        last_login_at: user.last_login_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
      })) as LocalUser[];
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (params: {
      username: string;
      password: string;
      fullName: string;
      role: AppRole
    }) => {
      // Call local-auth function to create user
      const { data, error } = await supabase.functions.invoke('local-auth', {
        body: {
          action: 'create_user',
          username: params.username,
          password: params.password,
          full_name: params.fullName,
          role: params.role
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-users'] });
      toast({
        title: "Utilisateur créé",
        description: "Le nouvel utilisateur a été créé avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (params: { 
      userId: string;
      username?: string;
      fullName?: string; 
      role?: AppRole;
      isActive?: boolean;
    }) => {
      if (params.fullName || params.isActive !== undefined) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: params.fullName,
            is_active: params.isActive,
          })
          .eq('user_id', params.userId);

        if (profileError) throw profileError;
      }

      if (params.role) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ user_id: params.userId, role: params.role }, { onConflict: 'user_id' });

        if (roleError) throw roleError;
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-users'] });
      toast({
        title: "Utilisateur modifié",
        description: "Les informations ont été mises à jour.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (params: { email: string }) => {
      const { error } = await supabase.auth.resetPasswordForEmail(params.email);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Lien de réinitialisation envoyé",
        description: "Un email de réinitialisation a été envoyé à l'utilisateur.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de réinitialiser le mot de passe.",
        variant: "destructive",
      });
    },
  });

  // Unlock user mutation
  const unlockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_locked: false, failed_login_attempts: 0 })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-users'] });
      toast({
        title: "Compte déverrouillé",
        description: "L'utilisateur peut maintenant se connecter.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de déverrouiller le compte.",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) throw roleError;

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-users'] });
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  return {
    users,
    loading,
    refetch,
    createUser: (username: string, password: string, fullName: string, role: AppRole) => 
      createUserMutation.mutateAsync({ username, password, fullName, role }),
    updateUser: (userId: string, username?: string, fullName?: string, role?: AppRole, isActive?: boolean) =>
      updateUserMutation.mutateAsync({ userId, username, fullName, role, isActive }),
    resetPassword: (email: string) =>
      resetPasswordMutation.mutateAsync({ email }),
    unlockUser: (userId: string) => unlockUserMutation.mutateAsync(userId),
    deleteUser: (userId: string) => deleteUserMutation.mutateAsync(userId),
    actionLoading: createUserMutation.isPending || updateUserMutation.isPending || 
                   resetPasswordMutation.isPending || unlockUserMutation.isPending || 
                   deleteUserMutation.isPending,
  };
}
