import { Rubrique } from "@/hooks/useRubriques";

/**
 * Vérifie si une rubrique est la rubrique spéciale "Solde du mois (antérieur)"
 */
export function isSoldeMoisAnterieurs(
  rubrique: Rubrique | { code?: string; libelle?: string; imp?: string | null }
): boolean {
  return (
    rubrique.code === 'SOLDE-ANT' || 
    (rubrique.libelle?.includes('Solde du mois (antérieur)') ?? false) ||
    rubrique.libelle === 'Solde du 31/10/2025' ||
    rubrique.imp === '707820'
  );
}

/**
 * Trie les rubriques en plaçant "Solde du mois (antérieur)" en première position
 * Cette rubrique doit toujours apparaître en haut des rapports (Feuille de caisse, Sommaire)
 */
export function sortRubriquesWithSoldeFirst<
  T extends Rubrique | { code?: string; libelle?: string; imp?: string | null }
>(
  rubriques: T[]
): T[] {
  return [...rubriques].sort((a, b) => {
    const aIsSolde = isSoldeMoisAnterieurs(a);
    const bIsSolde = isSoldeMoisAnterieurs(b);

    // Si a est solde et b ne l'est pas, a vient en premier
    if (aIsSolde && !bIsSolde) return -1;
    
    // Si b est solde et a ne l'est pas, b vient en premier
    if (!aIsSolde && bIsSolde) return 1;
    
    // Sinon, tri par code ou libellé
    const aCode = a.code || '';
    const bCode = b.code || '';
    return aCode.localeCompare(bCode);
  });
}

/**
 * Trie les opérations en plaçant les entrées "Solde du JJ/MM/AAAA" en première position.
 * Ces recettes représentent le solde d'ouverture et doivent toujours apparaître en tête de rapport,
 * quelque soit l'ordre d'enregistrement.
 */
export function sortOperationsWithSoldeFirst<T extends { designation?: string; rubrique?: string }>(
  operations: T[]
): T[] {
  return [...operations].sort((a, b) => {
    const aIsSolde =
      (a.designation?.toLowerCase().startsWith('solde du') ||
      a.rubrique?.toLowerCase().startsWith('solde du'));
    const bIsSolde =
      (b.designation?.toLowerCase().startsWith('solde du') ||
      b.rubrique?.toLowerCase().startsWith('solde du'));

    if (aIsSolde && !bIsSolde) return -1;
    if (!aIsSolde && bIsSolde) return 1;
    return 0;
  });
}
