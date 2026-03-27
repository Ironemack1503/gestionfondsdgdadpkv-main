
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback, useMemo } from 'react';
import { saveToCache, getFromCache, clearCache } from './useLocalStorageCache';
import { useLocalAuth } from '@/contexts/LocalAuthContext';
import { fetchCsvData } from '@/utils/fetchCsvData';

export interface Depense {
  id: string;
  numero_bon: number;  // N°d'ord (Auto)
  numero_beo?: string | null;  // N°BEO (4 chiffres)
  rubrique_id?: string | null;  // Référence à la rubrique
  service_id?: string | null;
  date?: string;  // Alias pour compatibilité
  date_transaction: string;  // Date d'enregistrement
  heure: string;  // Heure d'enregistrement
  libelle?: string;  // LIBELLE (descriptif)
  beneficiaire?: string | null;  // Bénéficiaire de la dépense (optionnel)
  motif: string;  // Motif (legacy)
  montant: number;  // Montant (CDF)
  montant_lettre: string | null;  // Montant en lettres
  imp?: string | null;  // Code IMP
  observation: string | null;  // Observations
  user_id: string;
  created_at: string;
  updated_at: string;
  rubrique?: {
    id: string;
    code: string;
    libelle: string;
  };
  service?: {
    id: string;
    code: string;
    libelle: string;
  };
}

const DEFAULT_PAGE_SIZE = 50;

export function useDepenses(initialPageSize = DEFAULT_PAGE_SIZE, useLocal = false) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useLocalAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Hook unifié : mode local (CSV) ou Supabase avec pagination
  const { data: depenses = [], isLoading, error } = useQuery({
    queryKey: ['depenses', useLocal, page, pageSize],
    queryFn: async () => {
      if (useLocal) {
        // Charge tout le CSV et applique la pagination côté client
        const all = await fetchCsvData('depenses.csv');
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        // Ajoute l'alias date_transaction pour compatibilité
        return all.slice(from, to).map((d: any) => ({
          ...d,
          date_transaction: d.date
        })) as Depense[];
      } else {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data, error } = await supabase
          .from('depenses')
          .select(`
            *,
            rubrique:rubriques(id, code, libelle)
          `)
          .order('date_transaction', { ascending: false })
          .order('heure', { ascending: false })
          .range(from, to);
        if (error) throw error;
        return (data || []).map(d => ({ ...d, date: d.date_transaction }));
      }
    },
  });

  // Fetch total count
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['depenses-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('depenses')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
  });

  // Memoize fetchAllForExport
  const fetchAllForExport = useCallback(async () => {
    const { data, error } = await supabase
      .from('depenses')
      .select(`
        *,
        rubrique:rubriques(id, code, libelle)
      `)
      .order('date_transaction', { ascending: false })
      .order('heure', { ascending: false });

    if (error) throw error;
    return data as Depense[];
  }, []);

  const createDepense = useMutation({
    mutationFn: async (depense: {
      date: string;
      heure?: string;
      numero_beo?: string | null;
      rubrique_id: string;
      beneficiaire?: string;
      libelle: string;
      motif: string;
      montant: number;
      montant_lettre?: string | null;
      imp?: string | null;
      observation?: string | null;
      service_id?: string;
    }) => {
      if (!user?.id) {
        throw new Error('Session invalide ou expirée');
      }

      const { data, error } = await supabase
        .from('depenses')
        .insert({
          ...depense,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      clearCache('depenses-page1');
      queryClient.invalidateQueries({ queryKey: ['depenses'] });
      queryClient.invalidateQueries({ queryKey: ['depenses-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({ title: 'Succès', description: 'Dépense enregistrée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateDepense = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Depense> & { id: string }) => {
      const { data, error } = await supabase
        .from('depenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      clearCache('depenses-page1');
      queryClient.invalidateQueries({ queryKey: ['depenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({ title: 'Succès', description: 'Dépense mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteDepense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('depenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      clearCache('depenses-page1');
      queryClient.invalidateQueries({ queryKey: ['depenses'] });
      queryClient.invalidateQueries({ queryKey: ['depenses-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({ title: 'Succès', description: 'Dépense supprimée' });
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

  return {
    depenses,
    isLoading,
    error,
    totalCount,
    page,
    setPage,
    totalPages,
    pageSize,
    setPageSize: handlePageSizeChange,
    createDepense,
    updateDepense,
    deleteDepense,
    fetchAllForExport,
  };
}
