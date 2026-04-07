import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RubriqueImpStat {
  imp: string;
  totalRecettes: number;
  totalDepenses: number;
}

// Noms des mois en majuscules (format de la table resultats)
const MOIS_NOMS_UPPER = [
  'JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
  'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE',
];

/**
 * Hook qui retourne les totaux RECETTES et DEPENSES par code IMP
 * depuis la table `resultats`, pour un mois/année donnés.
 * Si mois = 0, retourne les totaux pour toute l'année.
 */
export function useRubriquesStats(mois: number, annee: number) {
  const moisAnneeKey = mois > 0
    ? `${MOIS_NOMS_UPPER[mois - 1]}/${annee}`
    : null;

  return useQuery<RubriqueImpStat[]>({
    queryKey: ['rubriques-stats', moisAnneeKey ?? `ALL/${annee}`],
    queryFn: async () => {
      let query = supabase
        .from('resultats')
        .select('code, montant_recette, montant_depense')
        .neq('code', '-');

      if (moisAnneeKey) {
        query = query.eq('mois_annee', moisAnneeKey);
      } else {
        // Toute l'année
        query = query.like('mois_annee', `%/${annee}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data) return [];

      // Agréger par code IMP (gérer varianres A/B comme 632540A → 632540)
      const map = new Map<string, { recettes: number; depenses: number }>();

      for (const row of data) {
        // Normaliser le code : retirer suffixe alpha (ex: 632540A → 632540)
        const rawCode = (row.code || '').trim();
        // Si le code a 7+ chars avec lettre finale, tronquer à 6
        const code = rawCode.length > 6 && /^[0-9]{6}[A-Z]+$/i.test(rawCode)
          ? rawCode.slice(0, 6)
          : rawCode;

        if (!map.has(code)) {
          map.set(code, { recettes: 0, depenses: 0 });
        }
        const entry = map.get(code)!;
        entry.recettes += Number(row.montant_recette) || 0;
        entry.depenses += Number(row.montant_depense) || 0;
      }

      return Array.from(map.entries()).map(([imp, vals]) => ({
        imp,
        totalRecettes: vals.recettes,
        totalDepenses: vals.depenses,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
