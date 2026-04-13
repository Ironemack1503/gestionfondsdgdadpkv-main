import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DashboardStats } from '@/types/database';

export function useCloudDashboardStats() {
  const query = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];

      // Fetch all recettes for calculations
      const { data: recettes, error: recettesError } = await supabase
        .from('recettes')
        .select('montant, date_transaction');

      if (recettesError) throw recettesError;

      // Fetch all depenses for calculations
      const { data: depenses, error: depensesError } = await supabase
        .from('depenses')
        .select('montant, date_transaction');

      if (depensesError) throw depensesError;

      // Calculate stats
      const totalRecettes = recettes?.reduce((sum, r) => sum + Number(r.montant), 0) || 0;
      const totalDepenses = depenses?.reduce((sum, d) => sum + Number(d.montant), 0) || 0;

      const recettesJour = recettes
        ?.filter(r => r.date_transaction === today)
        .reduce((sum, r) => sum + Number(r.montant), 0) || 0;

      const depensesJour = depenses
        ?.filter(d => d.date_transaction === today)
        .reduce((sum, d) => sum + Number(d.montant), 0) || 0;

      const recettesMois = recettes
        ?.filter(r => r.date_transaction >= startOfMonth)
        .reduce((sum, r) => sum + Number(r.montant), 0) || 0;

      const depensesMois = depenses
        ?.filter(d => d.date_transaction >= startOfMonth)
        .reduce((sum, d) => sum + Number(d.montant), 0) || 0;

      const transactionsEnAttente = 0;

      // Fetch last 5 operations of the current month
      const { data: recentRec } = await supabase
        .from('recettes')
        .select('id, date_transaction, motif, montant, numero_bon, created_at')
        .gte('date_transaction', startOfMonth)
        .order('date_transaction', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentDep } = await supabase
        .from('depenses')
        .select('id, date_transaction, motif, montant, numero_bon, created_at')
        .gte('date_transaction', startOfMonth)
        .order('date_transaction', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      const recentTransactions = [
        ...(recentRec || []).map(r => ({
          id: r.id,
          date: r.date_transaction,
          reference: `REC-${String(r.numero_bon).padStart(4, '0')}`,
          type: 'Recette' as const,
          motif: r.motif || '',
          montant: Number(r.montant),
          created_at: r.created_at,
        })),
        ...(recentDep || []).map(d => ({
          id: d.id,
          date: d.date_transaction,
          reference: `DEP-${String(d.numero_bon).padStart(5, '0')}`,
          type: 'Dépense' as const,
          motif: d.motif || '',
          montant: Number(d.montant),
          created_at: d.created_at,
        })),
      ]
        .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
        .slice(0, 5);

      const soldeActuel = recettesMois - depensesMois;

      return {
        soldeActuel,
        recettesJour,
        depensesJour,
        recettesMois,
        depensesMois,
        nombreRecettes: recettes?.length || 0,
        nombreDepenses: depenses?.length || 0,
        transactionsEnAttente,
        recentTransactions,
      };
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Add legacy stats format for compatibility
  const stats = query.data ? {
    soldeCaisse: query.data.soldeActuel,
    recettesMois: query.data.recettesMois,
    depensesMois: query.data.depensesMois,
    programmationRestante: 0,
    recentTransactions: query.data.recentTransactions ?? [],
  } : {
    soldeCaisse: 0,
    recettesMois: 0,
    depensesMois: 0,
    programmationRestante: 0,
    recentTransactions: [],
  };

  return {
    ...query,
    stats,
  };
}
