
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback, useMemo } from 'react';
import { saveToCache, getFromCache, clearCache } from './useLocalStorageCache';
import { useLocalAuth } from '@/contexts/LocalAuthContext';
import { fetchCsvData } from '@/utils/fetchCsvData';

export interface Recette {
  id: string;
  numero_bon: number;  // N°d'ord (Auto)
  numero_beo?: string | null;  // N°BEO (4 chiffres)
  date: string;  // Date d'enregistrement
  date_transaction?: string;  // Alias pour compatibilité
  heure: string;  // Heure d'enregistrement
  libelle: string;  // LIBELLE (descriptif)
  motif: string;  // Motif (legacy)
  provenance: string;  // Provenance (legacy)
  montant: number;  // RECETTES (CDF)
  montant_lettre: string | null;  // Montant en lettres
  imp?: string | null;  // Code IMP
  observation: string | null;  // Observations
  service_id?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  service?: {
    id: string;
    code: string;
    libelle: string;
  };
}

const DEFAULT_PAGE_SIZE = 50;

export function useRecettes(initialPageSize = DEFAULT_PAGE_SIZE, useLocal = false) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useLocalAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Hook unifié : mode local (CSV) ou Supabase avec pagination
  const { data: recettes = [], isLoading, error } = useQuery({
    queryKey: ['recettes', useLocal, page, pageSize],
    queryFn: async () => {
      if (useLocal) {
        // Charge tout le CSV et applique la pagination côté client
        const all = await fetchCsvData('recettes.csv');
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        // Ajoute l'alias date_transaction pour compatibilité
        return all.slice(from, to).map((d: any) => ({
          ...d,
          date_transaction: d.date
        })) as Recette[];
      } else {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data, error } = await supabase
          .from('recettes')
          .select('*')
          .order('date', { ascending: false })
          .order('heure', { ascending: false })
          .range(from, to);
        if (error) throw error;
        return (data || []).map(r => ({ ...r, date_transaction: r.date }));
      }
    },
  });
// ...existing code...

  const createRecette = useMutation({
    mutationFn: async (recette: {
      numero_bon?: number;
      numero_beo?: string | null;
      date?: string;
      heure?: string;
      libelle: string;  // LIBELLE principal
      motif?: string;  // Copie de libelle pour compatibilité
      provenance?: string;  // Copie de libelle pour compatibilité
      montant: number;
      montant_lettre?: string | null;
      imp?: string | null;  // Code IMP
      observation?: string | null;
      service_id?: string;
    }) => {
      if (!user?.id) {
        throw new Error('Session invalide ou expirée');
      }

      console.log('🚀 Envoi vers Supabase:', { ...recette, user_id: user.id });

      const { data, error } = await supabase
        .from('recettes')
        .insert({
          ...recette,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }
      console.log('✅ Recette créée:', data);
      return data;
    },
    onSuccess: () => {
      clearCache('recettes-page1');
      queryClient.invalidateQueries({ queryKey: ['recettes'] });
      queryClient.invalidateQueries({ queryKey: ['recettes-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({ title: 'Succès', description: 'Recette enregistrée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateRecette = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Recette> & { id: string }) => {
      const { data, error } = await supabase
        .from('recettes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      clearCache('recettes-page1');
      queryClient.invalidateQueries({ queryKey: ['recettes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({ title: 'Succès', description: 'Recette mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteRecette = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recettes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      clearCache('recettes-page1');
      queryClient.invalidateQueries({ queryKey: ['recettes'] });
      queryClient.invalidateQueries({ queryKey: ['recettes-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({ title: 'Succès', description: 'Recette supprimée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const totalPages = useMemo(() => Math.ceil(totalCount / pageSize), [totalCount, pageSize]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  // Memoize fetchAllForExport
  const fetchAllForExport = useCallback(async () => {
    const { data, error } = await supabase
      .from('recettes')
      .select(`
        *,
        service:services(id, code, libelle)
      `)
      .order('date_transaction', { ascending: false })
      .order('heure', { ascending: false });

    if (error) throw error;
    return data as Recette[];
  }, []);

  return {
    recettes,
    isLoading,
    error,
    totalCount,
    page,
    setPage,
    totalPages,
    pageSize,
    setPageSize: handlePageSizeChange,
    createRecette,
    updateRecette,
    deleteRecette,
    fetchAllForExport,
  };
}
