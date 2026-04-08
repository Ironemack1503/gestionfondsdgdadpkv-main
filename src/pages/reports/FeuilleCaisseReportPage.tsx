/**
 * Feuille de Caisse Report Page
 * Displays detailed cash sheet with all transactions
 * Supports filtering by: type (All/Recettes/Dépenses), service, rubrique
 * Based on Crystal Reports: RAPPORTCAISSE, RAPPORTCAISSEREC, RAPPORTCAISSEDEP, 
 * RAPPORTCAISSETYP, RAPPORTDECAISSEPARSERVICE
 * Uses Advanced Report Editor templates for unified export
 */

import { useState, useMemo } from 'react';
import { Calendar, Loader2, FileText, FileSpreadsheet, FileDown, Printer, Filter, Building2, Tag, X } from 'lucide-react';
import { formatMontant } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useReportData, numberToFrenchWords } from '@/hooks/useReportData';
import { exportToPDF, exportToExcel, ExportColumn, exportFeuilleCaissePDF } from '@/lib/exportUtils';
import { exportToWord, generateTableHTML, generateSummaryHTML } from '@/lib/wordExport';
import { HEADER_IMAGE_BASE64, FOOTER_IMAGE_BASE64, FILIGRANE_IMAGE } from '@/lib/reportImages';
import { useServices } from '@/hooks/useServices';
import { useRubriques } from '@/hooks/useRubriques';
import { useLatestDataDate } from '@/hooks/useLatestDataDate';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FeuilleCaisseExportDialog, FeuilleCaisseExportParams } from '@/components/dialogs/FeuilleCaisseExportDialog';
import type { FeuilleCaisseItem } from '@/components/reports/FeuilleCaisseOfficielReport';

const moisNoms = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const moisNomsUpper = [
  'JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
  'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE'
];

/** Normalise un texte pour la comparaison (minuscules, sans accents) */
const normalizeText = (text: string): string =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

/**
 * Règles de correspondance motif → code comptable.
 * Basées sur les catégories Crystal Reports de la DGDA.
 * L'ordre est important : les règles plus spécifiques viennent en premier.
 */
const DEPENSE_CODE_RULES: Array<{ pattern: RegExp; code: string }> = [
  // 632540 - Contentieux (PV CX en dépense)
  { pattern: /pv\s*cx|contentieu|p\/c\s/i, code: '632540' },

  // 663841 - Collations (avant 604130 car plus spécifique)
  { pattern: /collation|collat\b/i, code: '663841' },

  // 604130 - Articles alimentaires / Restauration
  { pattern: /restauration|rencontres?\s+locales|complement\s+ration|colis\s+fin|approvisionnement\s+frigos|articles?\s+alimentaires/i, code: '604130' },

  // 618120 - Déplacement
  { pattern: /deplacement|courses?\s+(de\s+)?s(ce|ervice)|depot.*transmission|transport\s|vacation\s+et\s+deplacement/i, code: '618120' },

  // 632831 - Frais médicaux
  { pattern: /frais\s+medica|produits?\s+pharm|declaration\s+de\s+creance|provision.*urgence\s+medic|pret\s+remboursable|tranche.*declaration|tranche.*frais\s+medic|solde\s+frais\s+medic/i, code: '632831' },

  // 668340 - Frais funéraires et assistance deuil
  { pattern: /funerai|assistance\s+(deuil|cas\s+dec|nettoyeurs\s+fete|sociale\s+cas)/i, code: '668340' },

  // 631000 - Frais bancaires (avant 624000 car "intervention bancaire" ne doit pas matcher "intervention")
  { pattern: /intervention\s+bancaire|frais\s+bancaire|frais\s+d.intervention\s+bancaire|retrait\s+fonds/i, code: '631000' },

  // 624000 - Entretien, réparations et maintenance
  { pattern: /reparation|pces?\s+de\s+rechange|pieces?\s+de\s+rechange|courroie|batterie|entretien|maintenance|pneu|huile\s+de\s+frein|nettoyage\s+bus|regarnissage|evaporateur|climatisation|achat\s+axe\b/i, code: '624000' },

  // 604210 - Carburant et lubrifiant
  { pattern: /carburant|gasoil|essence|lubrifiant|graisse\s+(pour\s+)?charroi|huile\s+hydraulique/i, code: '604210' },

  // 604720 - Consommables informatiques
  { pattern: /toner|consommables?\s+inform|mat\.\s*(&|et)\s*cons|flash\s+disk|cartouche|achat\s+mat\.?\s*inform|complement\s+mat\.?\s*(&|et)/i, code: '604720' },

  // 605200 - Électricité
  { pattern: /electricite|onduleur|ampoule|rallonge|fusible\b|mat\.\s*electri|stabilisateur|regulateur|achat\s+unites?\s+laser/i, code: '605200' },

  // 604710 - Fournitures de bureau
  { pattern: /fournitures?\s+(de\s+)?bureau|registres?\s+indicat|cahiers?\s+registres|mobilier|complement\s+fournitures|destructeur\s+papier|achat\s+tables\b|tambours|splits?\s+et\s+accessoires|coffre\s+fort|indicateurs?\s+de\s+courriers|montage\s+armoire|montage\s+table|demontage\s+meuble|frais\s+de\s+montage\s+table/i, code: '604710' },

  // 605100 - Eau
  { pattern: /\beau\b|assainissement|regideso/i, code: '605100' },

  // 604300 - Produits d'entretien
  { pattern: /produits?\s+d.entretien|aniosgel/i, code: '604300' },

  // 632860 - Reliure, impression, reproduction
  { pattern: /reliure|reproduction\s+rapport|elaboration\s+(du\s+)?rapport/i, code: '632860' },

  // 628100 - Communications et télécommunications
  { pattern: /communication|abonnement|telephone|vodacom|orange\s+et\s+airtel|cable\s+utp|antenne|montage\s+antenne/i, code: '628100' },

  // 622210 - Loyers
  { pattern: /loyer|pment\s+loyer|garantie\s+locative/i, code: '622210' },

  // 632840 - Gardiennage et sécurité
  { pattern: /gardiennage/i, code: '632840' },

  // 661257 - Prime du comptable
  { pattern: /prime\s+du\s+comptable/i, code: '661257' },

  // 659800 - Autres charges (catch-all pour divers)
  { pattern: /manutention|salubrite|achat\s+cadenas|achat\s+malles|achat\s+sacs|achat\s+cylindre|achat\s+serrure|achat\s+baches|intervention\s+sces?\s+ext|frais\s+d.intervention\s+sces|frais\s+de?\s+recherche|chambres?\s+a\s+air|cable\s+de\s+remorcage|aide\s+au\s+mariage|prime\s+surveillance|achat\s+cordes|achat\s+palettes/i, code: '659800' },
];

/** Trouve le code comptable correspondant au motif d'une opération */
const findResultatCode = (
  motif: string,
  isRecette: boolean,
  codeMap: { code: string; libelle: string; categorie: string }[]
): string => {
  // Toutes les recettes → 707820
  if (isRecette) {
    const recetteEntry = codeMap.find(e => e.categorie === 'Recettes' && e.code !== '-');
    return recetteEntry?.code || '707820';
  }

  // Pour les dépenses, chercher dans les règles statiques (normalisé sans accents)
  const motifNorm = normalizeText(motif);
  for (const rule of DEPENSE_CODE_RULES) {
    if (rule.pattern.test(motifNorm)) {
      return rule.code;
    }
  }

  // Fallback : chercher dans les libellés de resultats
  if (codeMap.length > 0) {
    const depEntries = codeMap.filter(e => e.categorie === 'Dépenses' && e.code !== '-');
    let bestMatch = '';
    let bestCode = '';
    for (const entry of depEntries) {
      const libNorm = normalizeText(entry.libelle);
      if (motifNorm.includes(libNorm) && libNorm.length > bestMatch.length) {
        bestMatch = libNorm;
        bestCode = entry.code;
      }
    }
    if (bestCode) return bestCode;
  }

  return 'D';
};

type FilterType = 'all' | 'recettes' | 'depenses';

export default function FeuilleCaisseReportPage() {
  const { latestYear, latestMonth } = useLatestDataDate();
  const [selectedMois, setSelectedMois] = useState(latestMonth);
  const [selectedAnnee, setSelectedAnnee] = useState(latestYear);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  const [selectedRubriqueId, setSelectedRubriqueId] = useState<string>('all');
  const [groupByRubrique, setGroupByRubrique] = useState(false);
  
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const { generateFeuilleCaisse, calculateEtatResultat, isLoading, recettes, depenses } = useReportData();
  const { services, isLoading: loadingServices } = useServices();
  const { rubriques, isLoading: loadingRubriques } = useRubriques();

  // Fetch resultats code mapping for the selected month
  const moisAnneeKey = `${moisNomsUpper[selectedMois - 1]}/${selectedAnnee}`;
  const { data: resultatsCodes = [], isLoading: loadingCodes } = useQuery({
    queryKey: ['resultats-codes', moisAnneeKey],
    queryFn: async () => {
      const { data } = await supabase
        .from('resultats')
        .select('code, libelle, categorie')
        .eq('mois_annee', moisAnneeKey)
        .neq('code', '-');
      if (!data) return [];
      // Dédupliquer par code
      const seen = new Map<string, { code: string; libelle: string; categorie: string }>();
      for (const row of data) {
        if (row.code && !seen.has(row.code)) {
          seen.set(row.code, { code: row.code, libelle: row.libelle || '', categorie: row.categorie || '' });
        }
      }
      return Array.from(seen.values());
    },
    staleTime: 10 * 60 * 1000,
  });

  // Calculate date range from month/year
  const dateDebut = `${selectedAnnee}-${String(selectedMois).padStart(2, '0')}-01`;
  const lastDay = new Date(selectedAnnee, selectedMois, 0).getDate();
  const dateFin = `${selectedAnnee}-${String(selectedMois).padStart(2, '0')}-${lastDay}`;

  // Fetch previous month balance
  const { data: soldePrecedent = 0, isLoading: loadingBalance } = useQuery({
    queryKey: ['previous-month-balance', selectedMois, selectedAnnee],
    queryFn: async () => {
      let prevMois = selectedMois - 1;
      let prevAnnee = selectedAnnee;
      if (prevMois === 0) {
        prevMois = 12;
        prevAnnee = selectedAnnee - 1;
      }

      const startDate = `${prevAnnee}-${String(prevMois).padStart(2, '0')}-01`;
      const lastDayPrev = new Date(prevAnnee, prevMois, 0).getDate();
      const endDate = `${prevAnnee}-${String(prevMois).padStart(2, '0')}-${lastDayPrev}`;

      const { data: prevRecettes } = await supabase
        .from('recettes')
        .select('montant')
        .gte('date_transaction', startDate)
        .lte('date_transaction', endDate);

      const { data: prevDepenses } = await supabase
        .from('depenses')
        .select('montant')
        .gte('date_transaction', startDate)
        .lte('date_transaction', endDate);

      const totalRecettes = (prevRecettes || []).reduce((acc, r) => acc + Number(r.montant), 0);
      const totalDepenses = (prevDepenses || []).reduce((acc, d) => acc + Number(d.montant), 0);

      return totalRecettes - totalDepenses;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Generate report data
  const feuilleCaisseData = useMemo(() => {
    const data = generateFeuilleCaisse({ dateDebut, dateFin }, soldePrecedent);
    return data.map(row => {
      // Recettes → toujours 707820
      if (row.recette > 0) {
        return { ...row, imp: '707820' };
      }
      // Dépenses : utiliser imp_code depuis la DB si disponible (≠ 'D' = valeur fallback ancien)
      // 'D' ou null = pas encore de code IMP en base → appliquer règles statiques
      // Normaliser les codes avec suffixe lettre ex: 632540A → 632540
      if (row.imp && row.imp !== 'D') {
        const normalizedImp = row.imp.replace(/^(\d{6})[A-Za-z]+$/, '$1');
        if (/^\d{6}$/.test(normalizedImp)) {
          return { ...row, imp: normalizedImp }; // imp_code valide depuis base de données
        }
      }
      // Fallback : règles statiques sur le libellé
      return {
        ...row,
        imp: findResultatCode(row.libelle, false, resultatsCodes),
      };
    });
  }, [generateFeuilleCaisse, dateDebut, dateFin, soldePrecedent, resultatsCodes]);

  const etatResultat = useMemo(() => {
    return calculateEtatResultat({ dateDebut, dateFin }, soldePrecedent);
  }, [calculateEtatResultat, dateDebut, dateFin, soldePrecedent]);

  // Filter data based on selected type, service, and rubrique
  const filteredData = useMemo(() => {
    let data = feuilleCaisseData;
    
    // Filter by type
    if (filterType === 'recettes') {
      data = data.filter(row => row.recette > 0);
    } else if (filterType === 'depenses') {
      data = data.filter(row => row.depense > 0);
    }
    
    // Filter by service - need to look at original recettes/depenses data
    if (selectedServiceId !== 'all') {
      const recetteIds = recettes
        .filter(r => r.service_id === selectedServiceId)
        .map(r => r.id);
      const depenseIds = depenses
        .filter(d => d.service_id === selectedServiceId)
        .map(d => d.id);
      const validIds = new Set([...recetteIds, ...depenseIds]);
      data = data.filter(row => validIds.has(row.id));
    }
    
    // Filter by rubrique (only affects depenses)
    if (selectedRubriqueId !== 'all') {
      const depenseIds = depenses
        .filter(d => d.rubrique_id === selectedRubriqueId)
        .map(d => d.id);
      const validDepenseIds = new Set(depenseIds);
      // Keep recettes but filter depenses
      data = data.filter(row => row.recette > 0 || validDepenseIds.has(row.id));
    }
    
    return data;
  }, [feuilleCaisseData, filterType, selectedServiceId, selectedRubriqueId, recettes, depenses]);

  // Group data by rubrique if enabled
  const groupedData = useMemo(() => {
    if (!groupByRubrique) return null;
    
    const groups = new Map<string, { 
      rubrique: string; 
      rubriqueName: string;
      rows: typeof filteredData;
      totalRecettes: number;
      totalDepenses: number;
    }>();
    
    filteredData.forEach(row => {
      // Find the original depense to get rubrique
      const depense = depenses.find(d => d.id === row.id);
      const recette = recettes.find(r => r.id === row.id);
      
      let rubriqueCode = 'REC';
      let rubriqueName = 'Recettes';
      
      if (depense && depense.rubrique) {
        rubriqueCode = depense.rubrique.code;
        rubriqueName = depense.rubrique.libelle;
      } else if (recette) {
        rubriqueCode = 'REC';
        rubriqueName = 'Recettes';
      }
      
      if (!groups.has(rubriqueCode)) {
        groups.set(rubriqueCode, {
          rubrique: rubriqueCode,
          rubriqueName,
          rows: [],
          totalRecettes: 0,
          totalDepenses: 0,
        });
      }
      
      const group = groups.get(rubriqueCode)!;
      group.rows.push(row);
      group.totalRecettes += row.recette;
      group.totalDepenses += row.depense;
    });
    
    return Array.from(groups.values()).sort((a, b) => a.rubrique.localeCompare(b.rubrique));
  }, [filteredData, groupByRubrique, depenses, recettes]);

  // Calculate filtered totals
  const filteredTotals = useMemo(() => {
    const totalRecettes = filteredData.reduce((acc, row) => acc + (row.recette || 0), 0);
    const totalDepenses = filteredData.reduce((acc, row) => acc + (row.depense || 0), 0);
    return {
      totalRecettes,
      totalDepenses,
      encaisse: totalRecettes - totalDepenses,
      balance: soldePrecedent + totalRecettes - totalDepenses,
    };
  }, [filteredData, soldePrecedent]);

  // Get title based on filters
  const getReportTitle = () => {
    let title = '';
    switch (filterType) {
      case 'recettes':
        title = `Rapport des Recettes de Caisse`;
        break;
      case 'depenses':
        title = `Rapport des Dépenses de Caisse`;
        break;
      default:
        title = `Feuille de Caisse`;
    }
    
    if (selectedServiceId !== 'all') {
      const service = services.find(s => s.id === selectedServiceId);
      if (service) {
        title += ` - Service: ${service.libelle}`;
      }
    }
    
    if (selectedRubriqueId !== 'all') {
      const rubrique = rubriques.find(r => r.id === selectedRubriqueId);
      if (rubrique) {
        title += ` - Rubrique: ${rubrique.libelle}`;
      }
    }
    
    return `${title} - ${getMoisAnnee()}`;
  };

  const getFilterLabel = () => {
    const parts: string[] = [];
    
    switch (filterType) {
      case 'recettes':
        parts.push('Recettes uniquement');
        break;
      case 'depenses':
        parts.push('Dépenses uniquement');
        break;
      default:
        parts.push('Toutes les opérations');
    }
    
    if (selectedServiceId !== 'all') {
      const service = services.find(s => s.id === selectedServiceId);
      if (service) parts.push(`Service: ${service.code}`);
    }
    
    if (selectedRubriqueId !== 'all') {
      const rubrique = rubriques.find(r => r.id === selectedRubriqueId);
      if (rubrique) parts.push(`Rubrique: ${rubrique.code}`);
    }
    
    if (groupByRubrique) {
      parts.push('Groupé par rubrique');
    }
    
    return parts.join(' | ');
  };

  const hasActiveFilters = selectedServiceId !== 'all' || selectedRubriqueId !== 'all' || groupByRubrique;

  const clearFilters = () => {
    setSelectedServiceId('all');
    setSelectedRubriqueId('all');
    setGroupByRubrique(false);
  };

  // Format date for display
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const getMoisAnnee = () => `${moisNoms[selectedMois - 1]} ${selectedAnnee}`;

  // === EXPORT OFFICIEL via formulaire pré-export ===
  const handleOfficialExport = (params: FeuilleCaisseExportParams) => {
    const moisLabel = moisNoms[params.mois - 1];
    const reportData: FeuilleCaisseItem[] = filteredData.map(row => ({
      date: row.date,
      numeroOrdre: row.numeroOrdre,
      numeroBEO: row.numeroBEO,
      libelle: row.libelle,
      recette: row.recette,
      depense: row.depense,
      imp: row.imp,
    }));

    const totalRecettes = filteredData.reduce((s, r) => s + (r.recette || 0), 0);
    const totalDepenses = filteredData.reduce((s, r) => s + (r.depense || 0), 0);
    const solde = totalRecettes - totalDepenses;
    const balance = soldePrecedent + solde;
    // Montant en lettres avec centimes : "Francs Congolais: ... et XX centime"
    const absSolde = Math.abs(solde);
    const partieEntiere = Math.floor(absSolde);
    const centimes = Math.round((absSolde - partieEntiere) * 100);
    let totalEnLettres = `Francs Congolais:  ${numberToFrenchWords(partieEntiere)}`;
    if (centimes > 0) {
      totalEnLettres += ` et ${numberToFrenchWords(centimes)} centime`;
    }

    if (params.exportType === 'print') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write('<html><head><title>Feuille de Caisse</title>');
      printWindow.document.write(`<style>body{font-family:"Courier New",monospace;font-size:10pt;margin:20px;position:relative}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:2px 4px}th{background:#1e40af;color:#fff;text-align:center}.text-right{text-align:right}.grp-foot{background:#f5f5f5;font-style:italic}.total-row{background:#e5e7eb;font-weight:bold}.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.06;pointer-events:none;z-index:-1;width:500px;height:500px}@media print{.watermark{position:fixed}}</style>`);
      printWindow.document.write('</head><body>');
      printWindow.document.write(`<img class="watermark" src="${FILIGRANE_IMAGE}" alt="" />`);
      printWindow.document.write(buildOfficialHTML(reportData, moisLabel, params, totalRecettes, totalDepenses, solde, balance, totalEnLettres, true));
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
      return;
    }

    if (params.exportType === 'word') {
      const html = buildOfficialHTML(reportData, moisLabel, params, totalRecettes, totalDepenses, solde, balance, totalEnLettres, false);
      exportToWord({
        title: `FEUILLE DE CAISSE — MOIS DE ${moisLabel.toUpperCase()} ${params.annee}`,
        filename: `feuille_caisse_${moisLabel.toLowerCase()}_${params.annee}`,
        content: html,
        headerLines: [
          'République Démocratique du Congo',
          'Ministère des Finances',
          'Direction Générale des Douanes et Accises',
          'D.G.D.A.',
          'Direction Provinciale de Kinshasa',
        ],
      });
      return;
    }

    // PDF export — utilise la fonction dédiée Crystal Reports
    exportFeuilleCaissePDF({
      data: reportData,
      moisLabel,
      annee: params.annee,
      dateFeuille: params.dateFeuille,
      nomComptable: params.nomComptable,
      soldeInitial: soldePrecedent,
      totalEnLettres,
    });
  };

  /** Construit le HTML officiel Crystal Reports pour Word et impression */
  const buildOfficialHTML = (
    reportData: FeuilleCaisseItem[],
    moisLabel: string,
    params: FeuilleCaisseExportParams,
    totalRecettes: number,
    totalDepenses: number,
    solde: number,
    balance: number,
    totalEnLettres: string,
    includeHeader: boolean = true
  ): string => {
    // En-tête officiel DGDA (uniquement pour impression directe)
    const header = includeHeader ? `
      <div style="text-align:center;margin-bottom:8px">
        <img src="${HEADER_IMAGE_BASE64}" style="width:100%;max-width:700px;height:auto" alt="En-tête DGDA" />
      </div>
      <p style="font-weight:bold;font-size:10pt;margin:2px 0 8px 0;text-align:center;font-family:'Courier New',monospace">FEUILLE DE CAISSE MOIS DE<br/>${moisLabel.toUpperCase()} ${params.annee}</p>
      <p style="font-weight:bold;text-decoration:underline;text-align:left;font-family:'Courier New',monospace;font-size:10pt;margin:12px 0 8px 0">BUREAU&nbsp;&nbsp;COMPTABLE</p>
    ` : '';

    // Grouper par date
    const groups = new Map<string, FeuilleCaisseItem[]>();
    reportData.forEach(item => {
      const key = item.date;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });

    let rows = '';
    groups.forEach((items, dateKey) => {
      const dateFormatted = new Date(dateKey).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
      const grpR = items.reduce((s, i) => s + (i.recette || 0), 0);
      const grpD = items.reduce((s, i) => s + (i.depense || 0), 0);

      // En-tête de groupe supprimé — la date est déjà dans la colonne Date
      // Données
      items.forEach(item => {
        const libelleCleaned = (item.libelle || '').replace(/\s*-\s*null$/i, '').replace(/\s*null$/i, '');
        rows += `<tr>
          <td style="border:1px solid #000;padding:2px 4px;text-align:center;white-space:nowrap;font-size:8pt;font-weight:bold">${dateFormatted}</td>
          <td style="border:1px solid #000;padding:2px 4px;text-align:center;white-space:nowrap;font-size:8pt;font-weight:bold">${item.numeroOrdre}</td>
          <td style="border:1px solid #000;padding:2px 4px;text-align:center;white-space:nowrap;font-size:8pt;font-weight:bold">${item.numeroBEO}</td>
          <td style="border:1px solid #000;padding:2px 4px;white-space:nowrap;font-size:8pt;font-weight:bold">${libelleCleaned}</td>
          <td style="border:1px solid #000;padding:2px 4px;text-align:right;white-space:nowrap;font-size:8pt;font-weight:bold">${item.recette ? formatMontant(item.recette) : ''}</td>
          <td style="border:1px solid #000;padding:2px 4px;text-align:right;white-space:nowrap;font-size:8pt;font-weight:bold">${item.depense ? formatMontant(item.depense) : ''}</td>
          <td style="border:1px solid #000;padding:2px 4px;text-align:center;white-space:nowrap;font-size:8pt;font-weight:bold">${item.imp || ''}</td>
        </tr>`;
      });
      // Pied de groupe — ligne vide de séparation
      rows += `<tr>
        <td colspan="7" style="border:1px solid #000;padding:2px 4px">&nbsp;</td>
      </tr>`;
    });

    return `
      ${header}
      <table style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:10pt">
        <thead>
          <tr>
            <th style="border:1px solid #000;padding:2px 4px;text-align:center;width:70px">Date</th>
            <th style="border:1px solid #000;padding:2px 4px;text-align:center;width:40px">N°ORD</th>
            <th style="border:1px solid #000;padding:2px 4px;text-align:center;width:45px">N°BEO</th>
            <th style="border:1px solid #000;padding:2px 4px;text-align:center;font-weight:bold">LIBELLE</th>
            <th style="border:1px solid #000;padding:2px 4px;text-align:center" colspan="3">MONTANT</th>
          </tr>
          <tr>
            <th style="border:1px solid #000;padding:2px 4px" colspan="4"></th>
            <th style="border:1px solid #000;padding:2px 4px;text-align:center;width:110px">RECETTE</th>
            <th style="border:1px solid #000;padding:2px 4px;text-align:center;width:110px">DEPENSE</th>
            <th style="border:1px solid #000;padding:2px 4px;text-align:center;width:50px">IMP</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="font-weight:bold">
            <td colspan="4" style="border:1px solid #000;padding:2px 4px;text-align:right">TOTAL :</td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:right">${formatMontant(totalRecettes)}</td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:right">${formatMontant(totalDepenses)}</td>
            <td style="border:1px solid #000;padding:2px 4px"></td>
          </tr>
          <tr style="font-weight:bold">
            <td colspan="4" style="border:1px solid #000;padding:2px 4px;text-align:right">ENCAISSE :</td>
            <td colspan="2" style="border:1px solid #000;padding:2px 4px;text-align:right">${formatMontant(solde)}</td>
            <td style="border:1px solid #000;padding:2px 4px"></td>
          </tr>
          <tr style="font-weight:bold">
            <td colspan="4" style="border:1px solid #000;padding:2px 4px;text-align:right">BALANCE :</td>
            <td colspan="2" style="border:1px solid #000;padding:2px 4px;text-align:right">${formatMontant(balance)}</td>
            <td style="border:1px solid #000;padding:2px 4px"></td>
          </tr>
        </tfoot>
      </table>
      <div style="margin-top:8px;font-weight:bold;font-family:'Courier New',monospace;font-size:10pt;word-wrap:break-word;overflow-wrap:break-word;padding-left:120px;text-indent:-120px"><span>Nous disons :&nbsp;&nbsp;</span>${totalEnLettres}</div>
      <div style="page-break-inside:avoid;font-family:'Courier New',monospace;font-size:10pt">
        <p style="text-align:right;margin-top:16px">Fait à Kinshasa, le ${params.dateFeuille}</p>
        <p style="text-align:right;margin-top:10px;font-weight:bold">COMPTABLE PROVINCIALE DES DEPENSES</p>
        <p style="text-align:right;margin-top:8px;font-weight:bold">${params.nomComptable}</p>
      </div>
      <div style="margin-top:30px;text-align:center">
        <img src="${FOOTER_IMAGE_BASE64}" style="width:100%;max-width:700px;height:auto" alt="Pied de page DGDA" />
      </div>
    `;
  };

  // Export handlers (anciens — gardés pour compatibilité)
  const handleExportPDF = async () => {
    const columns: ExportColumn[] = filterType === 'all' 
      ? [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'N° Ordre', key: 'numeroOrdre', width: 12 },
          { header: 'N° BEO', key: 'numeroBEO', width: 15 },
          { header: 'Libellé', key: 'libelle', width: 40 },
          { header: 'Recette', key: 'recette', width: 18 },
          { header: 'Dépense', key: 'depense', width: 18 },
          { header: 'Solde', key: 'balance', width: 18 },
        ]
      : filterType === 'recettes'
      ? [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'N° Bon', key: 'numeroOrdre', width: 12 },
          { header: 'N° BEO', key: 'numeroBEO', width: 18 },
          { header: 'Provenance', key: 'libelle', width: 45 },
          { header: 'Montant (FC)', key: 'recette', width: 25 },
        ]
      : [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'N° Bon', key: 'numeroOrdre', width: 12 },
          { header: 'N° BEO', key: 'numeroBEO', width: 18 },
          { header: 'Bénéficiaire', key: 'libelle', width: 45 },
          { header: 'Montant (FC)', key: 'depense', width: 25 },
        ];

    const exportData = filterType === 'all'
      ? [
          {
            date: formatDate(dateDebut),
            numeroOrdre: '-',
            numeroBEO: 'REPORT',
            libelle: 'Solde de clôture mois antérieur',
            recette: soldePrecedent > 0 ? soldePrecedent : '',
            depense: soldePrecedent < 0 ? Math.abs(soldePrecedent) : '',
            balance: soldePrecedent,
          },
          ...filteredData.map(row => ({
            ...row,
            date: formatDate(row.date),
            recette: row.recette || '',
            depense: row.depense || '',
          })),
        ]
      : filteredData.map(row => ({
          ...row,
          date: formatDate(row.date),
          recette: row.recette || 0,
          depense: row.depense || 0,
        }));

    const subtitle = `Période: ${formatDate(dateDebut)} au ${formatDate(dateFin)} | ${getFilterLabel()}`;

    await exportToPDF({
      title: getReportTitle(),
      filename: `rapport_caisse_${filterType}_${moisNoms[selectedMois - 1].toLowerCase()}_${selectedAnnee}`,
      subtitle,
      columns,
      data: exportData,
    });
  };

  const handleExportExcel = () => {
    const columns: ExportColumn[] = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'N° Ordre', key: 'numeroOrdre', width: 10 },
      { header: 'N° BEO', key: 'numeroBEO', width: 15 },
      { header: 'Libellé', key: 'libelle', width: 40 },
      { header: 'Recette (FC)', key: 'recette', width: 18 },
      { header: 'Dépense (FC)', key: 'depense', width: 18 },
      { header: 'IMP', key: 'imp', width: 8 },
      { header: 'Total', key: 'total', width: 18 },
      { header: 'Caisse', key: 'caisse', width: 18 },
      { header: 'Balance', key: 'balance', width: 18 },
    ];

    const dataWithSolde = [
      {
        date: formatDate(dateDebut),
        numeroOrdre: '-',
        numeroBEO: 'REPORT',
        libelle: 'Solde de clôture mois antérieur',
        recette: soldePrecedent,
        depense: 0,
        imp: 'SP',
        total: soldePrecedent,
        caisse: soldePrecedent,
        balance: soldePrecedent,
      },
      ...filteredData.map(row => ({
        ...row,
        date: formatDate(row.date),
      })),
    ];

    exportToExcel({
      title: getReportTitle(),
      filename: `rapport_caisse_${filterType}_${moisNoms[selectedMois - 1].toLowerCase()}_${selectedAnnee}`,
      subtitle: `${getFilterLabel()} | Solde en lettres: ${numberToFrenchWords(Math.floor(filteredTotals.balance))} Francs Congolais`,
      columns,
      data: dataWithSolde,
    });
  };

  const handleExportWord = () => {
    const tableColumns = [
      { header: 'Date', key: 'date', type: 'text' as const },
      { header: 'N° Ordre', key: 'numeroOrdre', type: 'number' as const, align: 'center' as const },
      { header: 'N° BEO', key: 'numeroBEO', type: 'text' as const },
      { header: 'Libellé', key: 'libelle', type: 'text' as const },
      { header: 'Recette', key: 'recette', type: 'currency' as const },
      { header: 'Dépense', key: 'depense', type: 'currency' as const },
      { header: 'Balance', key: 'balance', type: 'currency' as const },
    ];

    const dataWithSolde = filterType === 'all'
      ? [
          {
            date: formatDate(dateDebut),
            numeroOrdre: '-',
            numeroBEO: 'REPORT',
            libelle: 'Solde de clôture mois antérieur',
            recette: soldePrecedent > 0 ? soldePrecedent : 0,
            depense: 0,
            balance: soldePrecedent,
          },
          ...filteredData.map(row => ({
            ...row,
            date: formatDate(row.date),
          })),
        ]
      : filteredData.map(row => ({
          ...row,
          date: formatDate(row.date),
        }));

    const summaryHTML = generateSummaryHTML([
      { label: 'Total Recettes', value: filteredTotals.totalRecettes, type: 'success' },
      { label: 'Total Dépenses', value: filteredTotals.totalDepenses, type: 'danger' },
      { label: 'Encaisse', value: filteredTotals.encaisse, type: filteredTotals.encaisse >= 0 ? 'success' : 'danger' },
      { label: 'Balance', value: filteredTotals.balance, type: 'info' },
    ]);

    const tableHTML = generateTableHTML(tableColumns, dataWithSolde, {
      showTotals: true,
      totalsLabel: 'TOTAUX',
      totalsColumns: ['recette', 'depense'],
    });

    const montantLettres = `<div class="montant-lettres">
      <strong>Solde en lettres:</strong> ${numberToFrenchWords(Math.floor(Math.abs(filteredTotals.balance)))} Francs Congolais
      ${filteredTotals.balance < 0 ? '(déficit)' : ''}
    </div>`;

    exportToWord({
      title: getReportTitle(),
      filename: `rapport_caisse_${filterType}_${moisNoms[selectedMois - 1].toLowerCase()}_${selectedAnnee}`,
      content: `
        <div class="subtitle">Période: ${formatDate(dateDebut)} au ${formatDate(dateFin)} - ${getFilterLabel()}</div>
        ${summaryHTML}
        ${tableHTML}
        ${montantLettres}
      `,
    });
  };

  const loading = isLoading || loadingBalance || loadingServices || loadingRubriques || loadingCodes;

  // Render grouped table
  const renderGroupedTable = () => {
    if (!groupedData || groupedData.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          Aucune opération pour cette période
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {groupedData.map((group) => (
          <Card key={group.rubrique} className="overflow-hidden">
            <CardHeader className="bg-muted/50 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">{group.rubrique}</Badge>
                  <span className="font-medium">{group.rubriqueName}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {group.totalRecettes > 0 && (
                    <span className="text-success">
                      Recettes: {formatMontant(group.totalRecettes)}
                    </span>
                  )}
                  {group.totalDepenses > 0 && (
                    <span className="text-destructive">
                      Dépenses: {formatMontant(group.totalDepenses)}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Date</TableHead>
                    <TableHead className="w-10 text-center">N°ORD</TableHead>
                    <TableHead className="w-14">N°BEO</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Montant (FC)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="font-bold">
                  {group.rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/30">
                      <TableCell className="whitespace-nowrap">{formatDate(row.date)}</TableCell>
                      <TableCell className="text-center font-medium whitespace-nowrap">
                        {row.recette > 0 ? `REC-${row.numeroOrdre}` : `DEP-${row.numeroOrdre}`}
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">{row.numeroBEO}</TableCell>
                      <TableCell className="truncate max-w-[280px]">{row.libelle}</TableCell>
                      <TableCell className={`text-right font-medium ${row.recette > 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatMontant(row.recette > 0 ? row.recette : row.depense)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render the transactions table
  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (groupByRubrique) {
      return renderGroupedTable();
    }

    if (filteredData.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          Aucune opération pour cette période
          {hasActiveFilters && (
            <div className="mt-2">
              <Button variant="link" onClick={clearFilters}>
                Effacer les filtres
              </Button>
            </div>
          )}
        </div>
      );
    }

    // Different table layouts based on filter type
    if (filterType === 'recettes') {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Date</TableHead>
                <TableHead className="w-10 text-center">N°ORD</TableHead>
                <TableHead className="w-14">N°BEO</TableHead>
                <TableHead>Provenance / Motif</TableHead>
                <TableHead className="text-right">Montant (FC)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-bold">
              {filteredData.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  <TableCell className="whitespace-nowrap">{formatDate(row.date)}</TableCell>
                  <TableCell className="text-center font-medium whitespace-nowrap">REC-{row.numeroOrdre}</TableCell>
                  <TableCell className="font-mono text-sm whitespace-nowrap">{row.numeroBEO}</TableCell>
                  <TableCell className="truncate max-w-[280px]">{row.libelle}</TableCell>
                  <TableCell className="text-right text-success font-medium">
                    {formatMontant(row.recette)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-success/10 font-bold">
                <TableCell colSpan={4}>TOTAL DES RECETTES</TableCell>
                <TableCell className="text-right text-success">
                  {formatMontant(filteredTotals.totalRecettes)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      );
    }

    if (filterType === 'depenses') {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Date</TableHead>
                <TableHead className="w-10 text-center">N°ORD</TableHead>
                <TableHead className="w-14">N°BEO</TableHead>
                <TableHead>Bénéficiaire / Motif</TableHead>
                <TableHead className="text-right">Montant (FC)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-bold">
              {filteredData.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  <TableCell className="whitespace-nowrap">{formatDate(row.date)}</TableCell>
                  <TableCell className="text-center font-medium whitespace-nowrap">DEP-{row.numeroOrdre}</TableCell>
                  <TableCell className="font-mono text-sm whitespace-nowrap">{row.numeroBEO}</TableCell>
                  <TableCell className="truncate max-w-[280px]">{row.libelle}</TableCell>
                  <TableCell className="text-right text-destructive font-medium">
                    {formatMontant(row.depense)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-destructive/10 font-bold">
                <TableCell colSpan={4}>TOTAL DES DÉPENSES</TableCell>
                <TableCell className="text-right text-destructive">
                  {formatMontant(filteredTotals.totalDepenses)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      );
    }

    // Default: All transactions
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20 whitespace-nowrap">Date</TableHead>
              <TableHead className="w-10 text-center whitespace-nowrap">N°ORD</TableHead>
              <TableHead className="w-14 whitespace-nowrap">N°BEO</TableHead>
              <TableHead>Libellé</TableHead>
              <TableHead className="text-right whitespace-nowrap">Recette (FC)</TableHead>
              <TableHead className="text-right whitespace-nowrap">Dépense (FC)</TableHead>
              <TableHead className="w-16 text-center whitespace-nowrap">IMP</TableHead>
              <TableHead className="text-right whitespace-nowrap">Total</TableHead>
              <TableHead className="text-right whitespace-nowrap">Caisse</TableHead>
              <TableHead className="text-right whitespace-nowrap">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Solde precedent row */}
            <TableRow className="bg-muted/50 font-bold">
              <TableCell className="whitespace-nowrap">{formatDate(dateDebut)}</TableCell>
              <TableCell className="text-center">-</TableCell>
              <TableCell>REPORT</TableCell>
              <TableCell>Solde de clôture mois antérieur</TableCell>
              <TableCell className="text-right text-success whitespace-nowrap">
                {soldePrecedent > 0 ? formatMontant(soldePrecedent) : '-'}
              </TableCell>
              <TableCell className="text-right text-destructive">-</TableCell>
              <TableCell className="text-center">SP</TableCell>
              <TableCell className="text-right whitespace-nowrap">{formatMontant(soldePrecedent)}</TableCell>
              <TableCell className="text-right whitespace-nowrap">{formatMontant(soldePrecedent)}</TableCell>
              <TableCell className="text-right font-bold whitespace-nowrap">{formatMontant(soldePrecedent)}</TableCell>
            </TableRow>
            {filteredData.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/30 font-bold">
                <TableCell className="whitespace-nowrap">{formatDate(row.date)}</TableCell>
                <TableCell className="text-center whitespace-nowrap">{row.numeroOrdre}</TableCell>
                <TableCell className="font-mono text-sm whitespace-nowrap">{row.numeroBEO}</TableCell>
                <TableCell className="truncate max-w-[300px]">{row.libelle}</TableCell>
                <TableCell className="text-right text-success whitespace-nowrap">
                  {row.recette > 0 ? formatMontant(row.recette) : '-'}
                </TableCell>
                <TableCell className="text-right text-destructive whitespace-nowrap">
                  {row.depense > 0 ? formatMontant(row.depense) : '-'}
                </TableCell>
                <TableCell className="text-center whitespace-nowrap font-mono text-xs">{row.imp}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{formatMontant(row.total)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{formatMontant(row.caisse)}</TableCell>
                <TableCell className="text-right font-bold whitespace-nowrap">{formatMontant(row.balance)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted font-bold">
              <TableCell colSpan={4}>TOTAUX</TableCell>
              <TableCell className="text-right text-success whitespace-nowrap">
                {formatMontant(filteredTotals.totalRecettes)}
              </TableCell>
              <TableCell className="text-right text-destructive whitespace-nowrap">
                {formatMontant(filteredTotals.totalDepenses)}
              </TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMontant(filteredTotals.encaisse)}
              </TableCell>
              <TableCell></TableCell>
              <TableCell className={`text-right whitespace-nowrap ${filteredTotals.balance >= 0 ? 'text-info' : 'text-destructive'}`}>
                {formatMontant(filteredTotals.balance)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapport Feuille de Caisse"
        description="État détaillé des opérations de caisse avec options de filtrage avancées"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setExportDialogOpen(true)} className="gap-2">
              <FileText className="w-4 h-4" />
              Exporter Rapport Officiel
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Period Filters */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Mois
              </Label>
              <select
                value={selectedMois}
                onChange={(e) => setSelectedMois(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {moisNoms.map((mois, index) => (
                  <option key={index} value={index + 1}>{mois}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Année</Label>
              <Input
                type="number"
                value={selectedAnnee}
                onChange={(e) => setSelectedAnnee(Number(e.target.value))}
                className="w-full"
                min={2020}
                max={2030}
              />
            </div>

            {/* Service Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Service
              </Label>
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les services</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.code} - {service.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rubrique Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Rubrique
              </Label>
              <Select value={selectedRubriqueId} onValueChange={setSelectedRubriqueId}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les rubriques" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les rubriques</SelectItem>
                  {rubriques.map((rubrique) => (
                    <SelectItem key={rubrique.id} value={rubrique.id}>
                      {rubrique.code} - {rubrique.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Group by Rubrique Toggle */}
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  id="group-rubrique"
                  checked={groupByRubrique}
                  onCheckedChange={setGroupByRubrique}
                />
                <Label htmlFor="group-rubrique" className="text-sm font-normal cursor-pointer">
                  Grouper par rubrique
                </Label>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">Filtres actifs:</span>
              <div className="flex flex-wrap gap-2">
                {selectedServiceId !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Service: {services.find(s => s.id === selectedServiceId)?.code}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedServiceId('all')} />
                  </Badge>
                )}
                {selectedRubriqueId !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Rubrique: {rubriques.find(r => r.id === selectedRubriqueId)?.code}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedRubriqueId('all')} />
                  </Badge>
                )}
                {groupByRubrique && (
                  <Badge variant="secondary" className="gap-1">
                    Groupé par rubrique
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setGroupByRubrique(false)} />
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-2">
                Tout effacer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-muted-foreground">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Solde Précédent</p>
            <p className="text-xl font-bold">{formatMontant(soldePrecedent, { showCurrency: true })}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Recettes</p>
            <p className="text-xl font-bold text-success">{formatMontant(etatResultat.totalRecettes, { showCurrency: true })}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Dépenses</p>
            <p className="text-xl font-bold text-destructive">{formatMontant(etatResultat.totalDepenses, { showCurrency: true })}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Encaisse</p>
            <p className={`text-xl font-bold ${etatResultat.encaisse >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatMontant(etatResultat.encaisse, { showCurrency: true })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className={`text-xl font-bold ${etatResultat.balance >= 0 ? 'text-info' : 'text-destructive'}`}>
              {formatMontant(etatResultat.balance, { showCurrency: true })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>{getReportTitle()}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Solde en lettres: <span className="font-medium">{numberToFrenchWords(Math.floor(Math.abs(filteredTotals.balance)))} Francs Congolais</span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>{filteredData.length} opération(s)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as FilterType)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Toutes ({feuilleCaisseData.length})
              </TabsTrigger>
              <TabsTrigger value="recettes" className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                Recettes ({feuilleCaisseData.filter(r => r.recette > 0).length})
              </TabsTrigger>
              <TabsTrigger value="depenses" className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive"></span>
                Dépenses ({feuilleCaisseData.filter(r => r.depense > 0).length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={filterType} className="mt-0">
              {renderTable()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {/* Formulaire pré-export officiel */}
      <FeuilleCaisseExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleOfficialExport}
        defaultMois={selectedMois}
        defaultAnnee={selectedAnnee}
      />
    </div>
  );
}
