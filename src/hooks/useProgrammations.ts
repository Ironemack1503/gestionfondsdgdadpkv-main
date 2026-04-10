import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useCallback } from 'react';
import { saveToCache, getFromCache } from './useLocalStorageCache';

export interface Programmation {
  id: number;
  numero: number | null;
  libelle: string | null;
  montant: number | null;
  mois: string | null;
  annee: string | null;
  code: string | null;
  comptable: string | null;
  daf: string | null;
  dp: string | null;
  date_programmation: string | null;
  created_at: string;
}

const moisNoms = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const MOIS_DB: Record<number, string> = {
  1: 'JANVIER', 2: 'FEVRIER', 3: 'MARS', 4: 'AVRIL',
  5: 'MAI', 6: 'JUIN', 7: 'JUILLET', 8: 'AOUT',
  9: 'SEPTEMBRE', 10: 'OCTOBRE', 11: 'NOVEMBRE', 12: 'DECEMBRE',
};

const MOIS_REVERSE: Record<string, number> = Object.fromEntries(
  Object.entries(MOIS_DB).map(([k, v]) => [v, Number(k)])
);

export function useProgrammations(selectedMois?: number, selectedAnnee?: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const moisStr = selectedMois ? MOIS_DB[selectedMois] : undefined;
  const anneeStr = selectedAnnee ? String(selectedAnnee) : undefined;

  const { data: programmations = [], isLoading, error } = useQuery({
    queryKey: ['programmations', moisStr, anneeStr],
    queryFn: async () => {
      let query = supabase
        .from('programmation_depenses' as any)
        .select('*');

      if (moisStr) query = query.eq('mois', moisStr);
      if (anneeStr) query = query.eq('annee', anneeStr);

      query = query.order('numero', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      const typedData = (data || []) as unknown as Programmation[];
      
      saveToCache(`programmations_${moisStr}_${anneeStr}`, typedData);
      return typedData;
    },
    staleTime: 30000,
    placeholderData: () => getFromCache<Programmation[]>(`programmations_${moisStr}_${anneeStr}`, 60 * 60 * 1000) ?? undefined,
  });

  const createProgrammation = useMutation({
    mutationFn: async (programmation: {
      mois: number;
      annee: number;
      libelle: string;
      montant: number;
    }) => {
      const moisInsert = MOIS_DB[programmation.mois];
      const anneeInsert = String(programmation.annee);

      // Determine next numero for this month/year from server
      const { data: maxRow } = await supabase
        .from('programmation_depenses' as any)
        .select('numero')
        .eq('mois', moisInsert)
        .eq('annee', anneeInsert)
        .order('numero', { ascending: false })
        .limit(1)
        .single();
      const maxNumero = (maxRow as any)?.numero || 0;

      const { data, error } = await supabase
        .from('programmation_depenses' as any)
        .insert({
          libelle: programmation.libelle,
          montant: programmation.montant,
          mois: moisInsert,
          annee: anneeInsert,
          numero: maxNumero + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programmations'] });
      queryClient.invalidateQueries({ queryKey: ['programmation-depenses'] });
      queryClient.invalidateQueries({ queryKey: ['programmations-report'] });
      toast({ title: 'Succès', description: 'Programmation créée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateProgrammation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number; libelle?: string; montant?: number }) => {
      const { data, error } = await supabase
        .from('programmation_depenses' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programmations'] });
      queryClient.invalidateQueries({ queryKey: ['programmation-depenses'] });
      queryClient.invalidateQueries({ queryKey: ['programmations-report'] });
      toast({ title: 'Succès', description: 'Programmation mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteProgrammation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('programmation_depenses' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programmations'] });
      queryClient.invalidateQueries({ queryKey: ['programmation-depenses'] });
      queryClient.invalidateQueries({ queryKey: ['programmations-report'] });
      toast({ title: 'Succès', description: 'Programmation supprimée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const formatMois = useCallback((mois: number, annee: number) => 
    `${moisNoms[mois - 1]} ${annee}`, []);

  const totalProgramme = useMemo(() => 
    (programmations || []).reduce((acc, p) => acc + Number(p.montant || 0), 0), 
    [programmations]
  );

  return {
    programmations,
    isLoading,
    error,
    totalProgramme,
    formatMois,
    moisNoms,
    MOIS_DB,
    createProgrammation,
    updateProgrammation,
    deleteProgrammation,
  };
}
