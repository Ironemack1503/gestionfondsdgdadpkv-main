import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook qui détecte la date la plus récente des données en base.
 * Utilisé pour initialiser les filtres de date sur la bonne période.
 */
export function useLatestDataDate() {
  const { data } = useQuery({
    queryKey: ['latest-data-date'],
    queryFn: async () => {
      const { data: recette } = await supabase
        .from('recettes')
        .select('date_transaction')
        .order('date_transaction', { ascending: false })
        .limit(1)
        .single();

      const { data: depense } = await supabase
        .from('depenses')
        .select('date_transaction')
        .order('date_transaction', { ascending: false })
        .limit(1)
        .single();

      const dates = [recette?.date_transaction, depense?.date_transaction].filter(Boolean) as string[];
      if (dates.length === 0) return null;
      dates.sort();
      return dates[dates.length - 1]; // La plus récente
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!data) return { latestYear: new Date().getFullYear(), latestMonth: new Date().getMonth() + 1 };

  const d = new Date(data);
  return { latestYear: d.getFullYear(), latestMonth: d.getMonth() + 1 };
}
