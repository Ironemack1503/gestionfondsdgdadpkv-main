/**
 * Sommaire Report Page — format identique au PDF SOMMAIRE officiel DGDA
 * Tableau : IMP | DESIGNATION | RECETTES | DEPENSES
 * Recettes groupées par (imp, libellé), Dépenses groupées par code IMP
 */

import { useState, useMemo } from 'react';
import { Calendar, Loader2, FileText, FileDown, Printer } from 'lucide-react';
import { formatMontant } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useRecettes } from '@/hooks/useRecettes';
import { useDepenses } from '@/hooks/useDepenses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { numberToFrenchWords } from '@/hooks/useReportData';
import { exportToWord } from '@/lib/wordExport';
import { exportSommairePDF } from '@/lib/exportUtils';
import { HEADER_IMAGE_BASE64, FOOTER_IMAGE_BASE64, FILIGRANE_IMAGE } from '@/lib/reportImages';
import { useLatestDataDate } from '@/hooks/useLatestDataDate';

// ── CONFIGURATION ─────────────────────────────────────────────────────────────

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const DEPENSES_IMP_MAP: Record<string, string> = {
  '604130': 'Articles alimentaires',
  '604210': 'Carburant et lubrifiant',
  '604300': "Produits d'entretien",
  '604710': 'Fournitures de bureau',
  '604720': 'Consommables informatiques',
  '605100': 'Eau',
  '605200': 'Electricité',
  '618120': 'Déplacement',
  '622210': 'Loyers locaux et bureaux de service',
  '624000': 'Entretien, réparations et maintenance',
  '626530': 'Abonnements',
  '628100': 'Frais de communications et télécommunications',
  '631000': 'Frais bancaire',
  '632530': 'Frais de justice',
  '632540': 'Paiement prime contentieuse',
  '632831': 'Frais médicaux',
  '632840': 'Frais de gardiennage et sécurité',
  '632860': "Frais d'impression, reproduction et reliure",
  '638410': 'Frais de mission intérieur',
  '659800': 'Autres charges',
  '661257': 'Prime du comptable',
  '661272': 'Prime de surveillance SEP',
  '661273': 'Prime amendes transactionnelles',
  '663841': 'Collations',
  '668340': 'Frais funéraires et assistance deuil',
  '668360': 'Aide & secours',
};

const DEPENSES_000000_BUCKETS: { designation: string; patterns: string[] }[] = [
  { designation: 'Fonctionnement SEP',                 patterns: ['fonct.*\\bsep\\b', '\\bsep\\b.*fonct'] },
  { designation: 'Fonctionnement secr DP',             patterns: ['secr.*\\bdp\\b', '\\bdp\\b.*secr', 'secrétaire dp', 'secrétariat dp'] },
  { designation: 'Fonctionnement unité genre',         patterns: ['unité genre', 'unite genre', '\\bgenre\\b'] },
  { designation: 'Fonctionnement Zone économique',     patterns: ['\\bzes\\b', 'zone.*(eco|éco)', 'économique'] },
  { designation: 'Fonctionnement Beach Ngobila',       patterns: ['ngobila', 'beach ngobila'] },
  { designation: 'Fonctionnement Nocafex',             patterns: ['nocafex'] },
  { designation: 'Fonctionnement Lerexcom',            patterns: ['lerexcom'] },
  { designation: 'Fonctionnement GU',                  patterns: ['\\bgu\\b'] },
  { designation: 'Fonctionnement Délégation syndicale', patterns: ['syndicale', 'délégation syndicale', 'delegation syndicale'] },
  { designation: 'Salubrité',                          patterns: ['salubrité', 'salubrite'] },
  { designation: 'Manutention',                        patterns: ['manutention'] },
  { designation: 'Service extérieur',                  patterns: ['service ext', 'extérieur', 'exterieur'] },
];

function matchDepense000000(motif: string): string {
  const lm = (motif || '').toLowerCase();
  for (const bucket of DEPENSES_000000_BUCKETS) {
    for (const pat of bucket.patterns) {
      try {
        if (new RegExp(pat, 'i').test(lm)) return bucket.designation;
      } catch {
        if (lm.includes(pat)) return bucket.designation;
      }
    }
  }
  return (motif || 'Fonctionnement divers').substring(0, 50).trim();
}

type SommaireRow = {
  type: 'recette' | 'depense';
  imp: string;
  designation: string;
  recette: number;
  depense: number;
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function SommaireReportPage() {
  const { latestYear, latestMonth } = useLatestDataDate();
  const [selectedMois, setSelectedMois] = useState(latestMonth);
  const [selectedAnnee, setSelectedAnnee] = useState(latestYear);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const today = new Date();
  const [dateFeuille, setDateFeuille] = useState(
    `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
  );
  const [exportMois, setExportMois] = useState(latestMonth);
  const [exportAnnee, setExportAnnee] = useState(latestYear);
  const [nomComptable, setNomComptable] = useState('');

  const { recettes, isLoading: loadingR } = useRecettes(100000);
  const { depenses, isLoading: loadingD } = useDepenses(100000);
  const isLoading = loadingR || loadingD;

  // Plage de dates du mois sélectionné
  const { dateDebut, dateFin } = useMemo(() => {
    const debut = `${selectedAnnee}-${String(selectedMois).padStart(2, '0')}-01`;
    const lastDay = new Date(selectedAnnee, selectedMois, 0).getDate();
    const fin = `${selectedAnnee}-${String(selectedMois).padStart(2, '0')}-${lastDay}`;
    return { dateDebut: debut, dateFin: fin };
  }, [selectedMois, selectedAnnee]);

  // Solde cumulé avant le début du mois
  const { data: soldePrecedent = 0 } = useQuery({
    queryKey: ['solde-precedent-sommaire', dateDebut],
    queryFn: async () => {
      const [{ data: rec }, { data: dep }] = await Promise.all([
        supabase.from('recettes').select('montant').lt('date_transaction', dateDebut),
        supabase.from('depenses').select('montant').lt('date_transaction', dateDebut),
      ]);
      const r = (rec || []).reduce((s, x) => s + Number(x.montant), 0);
      const d = (dep || []).reduce((s, x) => s + Number(x.montant), 0);
      return r - d;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Recettes et dépenses filtrées sur la période
  const periodRecettes = useMemo(
    () => recettes.filter(r => r.date_transaction >= dateDebut && r.date_transaction <= dateFin),
    [recettes, dateDebut, dateFin]
  );
  const periodDepenses = useMemo(
    () => depenses.filter(d => d.date_transaction >= dateDebut && d.date_transaction <= dateFin),
    [depenses, dateDebut, dateFin]
  );

  // Agrégation des lignes du Sommaire
  const sommaireRows = useMemo((): SommaireRow[] => {
    const rows: SommaireRow[] = [];

    // ── RECETTES : groupées par (imp, libellé) ──────────────────────────────
    const recetteMap = new Map<string, SommaireRow>();
    for (const r of periodRecettes) {
      const imp = (r.imp || '707820').trim();
      const parts = [r.motif, r.provenance].filter(Boolean);
      const designation = parts.join(' – ') || r.libelle || 'Recette';
      const key = `${imp}|${designation.toLowerCase()}`;
      if (recetteMap.has(key)) {
        recetteMap.get(key)!.recette += Number(r.montant);
      } else {
        recetteMap.set(key, { type: 'recette', imp, designation, recette: Number(r.montant), depense: 0 });
      }
    }
    const recetteRows = [...recetteMap.values()].sort((a, b) => {
      // "Solde du" toujours en première position
      const aIsSolde = a.designation.toLowerCase().startsWith('solde du');
      const bIsSolde = b.designation.toLowerCase().startsWith('solde du');
      if (aIsSolde && !bIsSolde) return -1;
      if (!aIsSolde && bIsSolde) return 1;
      return a.imp !== b.imp ? a.imp.localeCompare(b.imp) : a.designation.localeCompare(b.designation);
    });
    rows.push(...recetteRows);

    // ── DEPENSES : codes IMP fixes ──────────────────────────────────────────
    const fixedDepMap = new Map<string, SommaireRow>();
    for (const imp of Object.keys(DEPENSES_IMP_MAP)) {
      fixedDepMap.set(imp, { type: 'depense', imp, designation: DEPENSES_IMP_MAP[imp], recette: 0, depense: 0 });
    }

    // 000000 par sous-catégorie motif
    const dep000Map = new Map<string, SommaireRow>();
    // Codes inconnus
    const otherDepMap = new Map<string, SommaireRow>();

    for (const d of periodDepenses) {
      const imp = (d.imp_code || '000000').trim();
      const montant = Number(d.montant);
      if (fixedDepMap.has(imp)) {
        fixedDepMap.get(imp)!.depense += montant;
      } else if (imp === '000000') {
        const designation = matchDepense000000(d.motif || '');
        if (dep000Map.has(designation)) {
          dep000Map.get(designation)!.depense += montant;
        } else {
          dep000Map.set(designation, { type: 'depense', imp: '000000', designation, recette: 0, depense: montant });
        }
      } else {
        if (otherDepMap.has(imp)) {
          otherDepMap.get(imp)!.depense += montant;
        } else {
          otherDepMap.set(imp, { type: 'depense', imp, designation: `Code ${imp}`, recette: 0, depense: montant });
        }
      }
    }

    // Ajouter les lignes dépenses fixes (montant > 0 seulement)
    for (const row of fixedDepMap.values()) {
      if (row.depense > 0) rows.push(row);
    }

    // Ajouter les 000000 dans l'ordre des buckets
    const bucketOrder = DEPENSES_000000_BUCKETS.map(b => b.designation);
    const sorted000 = [...dep000Map.values()].sort((a, b) => {
      const ai = bucketOrder.indexOf(a.designation);
      const bi = bucketOrder.indexOf(b.designation);
      if (ai === -1 && bi === -1) return a.designation.localeCompare(b.designation);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    for (const row of sorted000) {
      if (row.depense > 0) rows.push(row);
    }

    // Ajouter tout code inconnu restant
    for (const row of otherDepMap.values()) {
      if (row.depense > 0) rows.push(row);
    }

    return rows;
  }, [periodRecettes, periodDepenses]);

  // Totaux
  const totalRecettesLignes = useMemo(
    () => sommaireRows.filter(r => r.type === 'recette').reduce((s, r) => s + r.recette, 0),
    [sommaireRows]
  );
  const totalDepenses = useMemo(
    () => sommaireRows.filter(r => r.type === 'depense').reduce((s, r) => s + r.depense, 0),
    [sommaireRows]
  );
  // TOTAL = somme des lignes visibles (pas de soldePrecedent ajouté)
  const totalRecettes = totalRecettesLignes;
  const encaisse = totalRecettes - totalDepenses;

  // ── HTML EXPORT ────────────────────────────────────────────────────────────

  const buildSommaireHTML = (forPrint = true): string => {
    const moisLabel = MOIS_NOMS[exportMois - 1];
    const comptable = nomComptable.trim() || '____________________';

    const tdStyle = 'border:1px solid #000;padding:2px 5px;font-weight:bold;font-size:9pt';
    const tdC = `${tdStyle};text-align:center`;
    const tdR = `${tdStyle};text-align:right`;

    const recetteRowsHTML = sommaireRows
      .filter(r => r.type === 'recette')
      .map(row => `
      <tr>
        <td style="${tdC}">${row.imp}</td>
        <td style="${tdStyle}">${row.designation}</td>
        <td style="${tdR}">${formatMontant(row.recette)}</td>
        <td style="${tdR}"></td>
      </tr>`)
      .join('');

    const depenseRowsHTML = sommaireRows
      .filter(r => r.type === 'depense')
      .map(row => `
      <tr>
        <td style="${tdC}">${row.imp}</td>
        <td style="${tdStyle}">${row.designation}</td>
        <td style="${tdR}"></td>
        <td style="${tdR}">${formatMontant(row.depense)}</td>
      </tr>`)
      .join('');

    const header = forPrint
      ? `<div style="text-align:center;margin-bottom:8px">
          <img src="${HEADER_IMAGE_BASE64}" style="width:100%;max-width:700px;height:auto" alt="En-tête DGDA" />
        </div>`
      : '';

    return `
      ${header}
      <p style="font-weight:bold;font-size:11pt;margin:4px 0;text-align:center;font-family:'Courier New',monospace">
        SOMMAIRE DU MOIS DE ${moisLabel.toUpperCase()} ${exportAnnee}
      </p>
      <p style="font-size:10pt;margin:2px 0;text-align:center;font-family:'Courier New',monospace">
        Direction Provinciale Kinshasa-Ville
      </p>
      <p style="font-size:10pt;margin:2px 0 10px 0;text-align:center;font-family:'Courier New',monospace">
        DGDA/3400/DP/KV/SDAF/&nbsp;&nbsp;/${exportAnnee}
      </p>
      <table style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:10pt">
        <thead>
          <tr>
            <th style="border:1px solid #000;padding:2px 5px;text-align:center;width:65px">IMP.</th>
            <th style="border:1px solid #000;padding:2px 5px;text-align:center">DESIGNATION</th>
            <th style="border:1px solid #000;padding:2px 5px;text-align:center" colspan="2">MONTANTS</th>
          </tr>
          <tr>
            <th colspan="2" style="border:1px solid #000;padding:2px 5px"></th>
            <th style="border:1px solid #000;padding:2px 5px;text-align:center;width:130px">RECETTES</th>
            <th style="border:1px solid #000;padding:2px 5px;text-align:center;width:130px">DEPENSES</th>
          </tr>
        </thead>
        <tbody>
          ${recetteRowsHTML}
          ${depenseRowsHTML}
        </tbody>
        <tfoot>
          <tr style="font-weight:bold">
            <td colspan="2" style="border:1px solid #000;padding:2px 5px;text-align:right">TOTAL :</td>
            <td style="border:1px solid #000;padding:2px 5px;text-align:right">${formatMontant(totalRecettes)}</td>
            <td style="border:1px solid #000;padding:2px 5px;text-align:right">${formatMontant(totalDepenses)}</td>
          </tr>
          <tr style="font-weight:bold">
            <td colspan="2" style="border:1px solid #000;padding:2px 5px;text-align:right">ENCAISSE :</td>
            <td style="border:1px solid #000;padding:2px 5px;text-align:right"></td>
            <td style="border:1px solid #000;padding:2px 5px;text-align:right">${formatMontant(encaisse)}</td>
          </tr>
          <tr style="font-weight:bold">
            <td colspan="2" style="border:1px solid #000;padding:2px 5px;text-align:right">BALANCE :</td>
            <td style="border:1px solid #000;padding:2px 5px;text-align:right">${formatMontant(totalRecettes)}</td>
            <td style="border:1px solid #000;padding:2px 5px;text-align:right">${formatMontant(totalDepenses + encaisse)}</td>
          </tr>
        </tfoot>
      </table>
      <div style="margin-top:10px;font-weight:bold;font-family:'Courier New',monospace;font-size:10pt;word-wrap:break-word">
        <span>Nous disons :&nbsp;&nbsp;Francs Congolais:&nbsp;&nbsp;${numberToFrenchWords(Math.floor(Math.abs(encaisse)))}</span>
        ${(() => { const c = Math.round((Math.abs(encaisse) - Math.floor(Math.abs(encaisse))) * 100); return c > 0 ? ` et ${numberToFrenchWords(c)} centime` : ''; })()}
      </div>
      <div style="page-break-inside:avoid;font-family:'Courier New',monospace;font-size:10pt">
        <p style="text-align:right;margin-top:16px">Fait à Kinshasa, le ${dateFeuille}</p>
        <p style="text-align:right;margin-top:10px;font-weight:bold">COMPTABLE PROVINCIALE DES DEPENSES</p>
        <p style="text-align:right;margin-top:8px;font-weight:bold">${comptable}</p>
      </div>
      <div style="margin-top:30px;text-align:center">
        <img src="${FOOTER_IMAGE_BASE64}" style="width:100%;max-width:700px;height:auto" alt="Pied de page DGDA" />
      </div>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Sommaire DGDA</title>');
    printWindow.document.write(
      `<style>body{font-family:"Courier New",monospace;font-size:10pt;margin:20px;position:relative}` +
      `table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:2px 5px}` +
      `.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.06;` +
      `pointer-events:none;z-index:-1;width:500px;height:500px}` +
      `@media print{.watermark{position:fixed}}</style>`
    );
    printWindow.document.write('</head><body>');
    printWindow.document.write(`<img class="watermark" src="${FILIGRANE_IMAGE}" alt="" />`);
    printWindow.document.write(buildSommaireHTML(true));
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handlePDFExport = () => {
    const moisLabel = MOIS_NOMS[exportMois - 1];
    const absEncaisse = Math.abs(encaisse);
    const partieEntiere = Math.floor(absEncaisse);
    const centimes = Math.round((absEncaisse - partieEntiere) * 100);
    let encaisseEnLettres = `Francs Congolais:  ${numberToFrenchWords(partieEntiere)}`;
    if (centimes > 0) {
      encaisseEnLettres += ` et ${numberToFrenchWords(centimes)} centime`;
    }
    exportSommairePDF({
      rows: sommaireRows,
      soldePrecedent,
      moisLabel,
      annee: exportAnnee,
      dateFeuille,
      nomComptable: nomComptable.trim() || '____________________',
      encaisseEnLettres,
    });
  };

  const handleWordExport = () => {
    const moisLabel = MOIS_NOMS[exportMois - 1];
    exportToWord({
      title: `SOMMAIRE — MOIS DE ${moisLabel.toUpperCase()} ${exportAnnee}`,
      filename: `sommaire_${moisLabel.toLowerCase()}_${exportAnnee}`,
      content: buildSommaireHTML(false),
      headerLines: [
        'République Démocratique du Congo',
        'Ministère des Finances',
        'Direction Générale des Douanes et Accises',
        'Direction Provinciale de Kinshasa',
      ],
    });
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────

  const recetteRows = sommaireRows.filter(r => r.type === 'recette');
  const depenseRows = sommaireRows.filter(r => r.type === 'depense');

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="Sommaire"
        description="Récapitulatif mensuel des recettes et dépenses par code IMP"
      />

      {/* Filtres */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label>Mois</Label>
              <Select value={String(selectedMois)} onValueChange={v => setSelectedMois(Number(v))}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOIS_NOMS.map((nom, idx) => (
                    <SelectItem key={idx + 1} value={String(idx + 1)}>{nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Année</Label>
              <Select value={String(selectedAnnee)} onValueChange={v => setSelectedAnnee(Number(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => { setExportMois(selectedMois); setExportAnnee(selectedAnnee); setExportDialogOpen(true); }} className="ml-auto gap-2">
              <FileDown className="w-4 h-4" />
              Exporter Rapport Officiel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau principal */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              SOMMAIRE DU MOIS DE {MOIS_NOMS[selectedMois - 1].toUpperCase()} {selectedAnnee}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-center w-20 border-r">IMP.</TableHead>
                  <TableHead className="font-bold border-r">DESIGNATION</TableHead>
                  <TableHead className="font-bold text-right w-40 border-r">RECETTES</TableHead>
                  <TableHead className="font-bold text-right w-40">DEPENSES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {/* Recettes (sans ligne "Solde du mois antérieur" — le sommaire est une synthèse) */}
                {recetteRows.map((row, i) => (
                  <TableRow key={`r-${i}`}>
                    <TableCell className="font-bold text-center border-r">{row.imp}</TableCell>
                    <TableCell className="font-bold border-r">{row.designation}</TableCell>
                    <TableCell className="font-bold text-right border-r text-green-700">
                      {formatMontant(row.recette)}
                    </TableCell>
                    <TableCell className="font-bold text-right" />
                  </TableRow>
                ))}
                {/* Dépenses */}
                {depenseRows.map((row, i) => (
                  <TableRow key={`d-${i}`}>
                    <TableCell className="font-bold text-center border-r">{row.imp}</TableCell>
                    <TableCell className="font-bold border-r">{row.designation}</TableCell>
                    <TableCell className="font-bold text-right border-r" />
                    <TableCell className="font-bold text-right text-red-700">
                      {formatMontant(row.depense)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="text-right font-bold border-r">TOTAL :</TableCell>
                  <TableCell className="text-right font-bold border-r">{formatMontant(totalRecettes)}</TableCell>
                  <TableCell className="text-right font-bold">{formatMontant(totalDepenses)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2} className="text-right font-bold border-r">ENCAISSE :</TableCell>
                  <TableCell className="text-right font-bold border-r"></TableCell>
                  <TableCell className="text-right font-bold">{formatMontant(encaisse)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2} className="text-right font-bold border-r">BALANCE :</TableCell>
                  <TableCell className="text-right font-bold border-r">{formatMontant(totalRecettes)}</TableCell>
                  <TableCell className="text-right font-bold">{formatMontant(totalDepenses + encaisse)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog d'export */}
      <Dialog open={exportDialogOpen} onOpenChange={v => !v && setExportDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Exporter Sommaire Officiel
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations avant d'exporter le rapport Sommaire
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dateSommaire">Date du Sommaire</Label>
              <Input
                id="dateSommaire"
                value={dateFeuille}
                onChange={e => setDateFeuille(e.target.value)}
                placeholder="JJ/MM/AAAA"
              />
            </div>
            <div className="space-y-2">
              <Label>Mois</Label>
              <Select value={String(exportMois)} onValueChange={v => setExportMois(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOIS_NOMS.map((nom, idx) => (
                    <SelectItem key={idx + 1} value={String(idx + 1)}>{nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exportAnnee">Année</Label>
              <Input
                id="exportAnnee"
                type="number"
                value={exportAnnee}
                onChange={e => setExportAnnee(Number(e.target.value))}
                min={2020}
                max={2030}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomComptable">Nom du Comptable</Label>
              <Input
                id="nomComptable"
                value={nomComptable}
                onChange={e => setNomComptable(e.target.value)}
                placeholder="Nom du comptable provincial"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={() => { handleWordExport(); setExportDialogOpen(false); }}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Word
            </Button>
            <Button
              onClick={() => { handlePDFExport(); setExportDialogOpen(false); }}
              className="gap-2"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
