/**
 * Rapport Programmation des Dépenses — format identique au PDF PROGRAMMATION officiel DGDA
 * Tableau : N° | LIBELLE | MONTANTS
 * Données : table programmation_depenses (importée depuis Access DETPGM)
 * En-tête/pied de page identiques au Sommaire
 */

import { useState, useMemo } from 'react';
import { Calendar, Loader2, FileText, FileDown, Printer, Search } from 'lucide-react';
import { formatMontant } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkeleton, SummaryCardSkeleton } from '@/components/shared/Skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { exportToWord } from '@/lib/wordExport';
import { exportProgrammationPDF } from '@/lib/exportUtils';
import { HEADER_IMAGE_BASE64, FOOTER_IMAGE_BASE64, FILIGRANE_IMAGE } from '@/lib/reportImages';

// ── CONFIG ────────────────────────────────────────────────────────────────────

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const MOIS_DB: Record<number, string> = {
  1: 'JANVIER', 2: 'FEVRIER', 3: 'MARS', 4: 'AVRIL',
  5: 'MAI', 6: 'JUIN', 7: 'JUILLET', 8: 'AOUT',
  9: 'SEPTEMBRE', 10: 'OCTOBRE', 11: 'NOVEMBRE', 12: 'DECEMBRE',
};

const numberToFrenchWords = (num: number): string => {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

  if (num === 0) return 'zéro';
  if (num < 0) return 'moins ' + numberToFrenchWords(-num);

  let words = '';

  if (num >= 1000000000) {
    words += numberToFrenchWords(Math.floor(num / 1000000000)) + ' milliard ';
    num %= 1000000000;
  }
  if (num >= 1000000) {
    words += numberToFrenchWords(Math.floor(num / 1000000)) + ' million ';
    num %= 1000000;
  }
  if (num >= 1000) {
    if (Math.floor(num / 1000) === 1) {
      words += 'mille ';
    } else {
      words += numberToFrenchWords(Math.floor(num / 1000)) + ' mille ';
    }
    num %= 1000;
  }
  if (num >= 100) {
    if (Math.floor(num / 100) === 1) {
      words += 'cent ';
    } else {
      words += units[Math.floor(num / 100)] + ' cent ';
    }
    num %= 100;
  }
  if (num >= 20) {
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    if (ten === 7 || ten === 9) {
      words += tens[ten - 1] + '-' + units[10 + unit];
    } else if (unit === 1 && ten !== 8) {
      words += tens[ten] + ' et un';
    } else if (unit > 0) {
      words += tens[ten] + '-' + units[unit];
    } else {
      words += tens[ten];
    }
    num = 0;
  }
  if (num > 0) {
    words += units[num];
  }

  return words.trim();
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function ProgrammationReportPage() {
  const currentDate = new Date();
  const [selectedMois, setSelectedMois] = useState(currentDate.getMonth() + 1);
  const [selectedAnnee, setSelectedAnnee] = useState(String(currentDate.getFullYear()));
  const [searchQuery, setSearchQuery] = useState('');

  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [dateProgrammation, setDateProgrammation] = useState(
    `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`
  );
  const [exportMois, setExportMois] = useState(currentDate.getMonth() + 1);
  const [exportAnnee, setExportAnnee] = useState(String(currentDate.getFullYear()));
  const [nomDAF, setNomDAF] = useState('');
  const [nomDP, setNomDP] = useState('');

  // Fetch data from programmation_depenses
  const moisDB = MOIS_DB[selectedMois] || '';
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['programmation-depenses', moisDB, selectedAnnee],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programmation_depenses' as any)
        .select('*')
        .eq('mois', moisDB)
        .eq('annee', selectedAnnee)
        .order('numero', { ascending: true });
      if (error) throw error;
      return (data || []) as Array<{
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
      }>;
    },
  });

  // Pre-fill DAF/DP names from first data row
  const defaultDAF = rows[0]?.daf || '';
  const defaultDP = rows[0]?.dp || '';

  // Filter by search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(r => (r.libelle || '').toLowerCase().includes(q));
  }, [rows, searchQuery]);

  // Totals
  const total = useMemo(() => filteredRows.reduce((s, r) => s + Number(r.montant || 0), 0), [filteredRows]);
  const totalInWords = numberToFrenchWords(Math.floor(total));

  // ── HTML BUILDER ───────────────────────────────────────────────────────────

  const buildProgrammationHTML = (forPrint = true): string => {
    const moisLabel = MOIS_NOMS[exportMois - 1];
    const daf = nomDAF.trim() || defaultDAF || '____________________';
    const dp = nomDP.trim() || defaultDP || '____________________';
    const montantEnLettres = `${numberToFrenchWords(Math.floor(total))} Francs Congolais`;

    const tdStyle = 'border:1px solid #000;padding:2px 5px;font-weight:bold;font-size:9pt';
    const tdC = `${tdStyle};text-align:center`;
    const tdR = `${tdStyle};text-align:right`;

    const bodyHTML = filteredRows
      .map((row, i) => `
      <tr>
        <td style="${tdC}">${i + 1}</td>
        <td style="${tdStyle}">${row.libelle || ''}</td>
        <td style="${tdR}">${formatMontant(Number(row.montant || 0))}</td>
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
        PROGRAMATION DES DEPENSES MOIS DE ${moisLabel.toUpperCase()} ${exportAnnee}
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
            <th style="border:1px solid #000;padding:2px 5px;text-align:center;width:40px">N°.</th>
            <th style="border:1px solid #000;padding:2px 5px;text-align:center">LIBELLE</th>
            <th style="border:1px solid #000;padding:2px 5px;text-align:center;width:140px">MONTANTS</th>
          </tr>
        </thead>
        <tbody>
          ${bodyHTML}
        </tbody>
        <tfoot>
          <tr style="font-weight:bold">
            <td colspan="2" style="border:1px solid #000;padding:2px 5px;text-align:right">MONTANTS TOTAL</td>
            <td style="border:1px solid #000;padding:2px 5px;text-align:right">${formatMontant(total)}</td>
          </tr>
        </tfoot>
      </table>
      <div style="margin-top:10px;font-weight:bold;font-family:'Courier New',monospace;font-size:10pt;word-wrap:break-word">
        <span>Nous disons :&nbsp;&nbsp;</span>${montantEnLettres}
      </div>
      <div style="page-break-inside:avoid;font-family:'Courier New',monospace;font-size:10pt">
        <p style="text-align:center;margin-top:16px">Fait à Kinshasa, le ${dateProgrammation}</p>
        <table style="width:100%;border:none;margin-top:20px;font-family:'Courier New',monospace;font-size:10pt">
          <tr>
            <td style="border:none;width:50%;text-align:left;vertical-align:top;font-weight:bold;font-size:8pt">
              LE SOUS-DIRECTEUR CHARGE DE<br/>L'ADMINISTRATION ET DES FINANCES<br/><br/><br/><br/><span style="font-size:10pt">${daf}</span>
            </td>
            <td style="border:none;width:50%;text-align:left;vertical-align:top;font-weight:bold;font-size:8pt">
              LE DIRECTEUR PROVINCIAL<br/><br/><br/><br/><br/><span style="font-size:10pt">${dp}</span>
            </td>
          </tr>
        </table>
      </div>
      <div style="margin-top:30px;text-align:center">
        <img src="${FOOTER_IMAGE_BASE64}" style="width:100%;max-width:700px;height:auto" alt="Pied de page DGDA" />
      </div>
    `;
  };

  // ── EXPORT HANDLERS ────────────────────────────────────────────────────────

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Programmation DGDA</title>');
    printWindow.document.write(
      `<style>body{font-family:"Courier New",monospace;font-size:10pt;margin:20px;position:relative}` +
      `table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:2px 5px}` +
      `.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.06;` +
      `pointer-events:none;z-index:-1;width:500px;height:500px}` +
      `@media print{.watermark{position:fixed}}</style>`
    );
    printWindow.document.write('</head><body>');
    printWindow.document.write(`<img class="watermark" src="${FILIGRANE_IMAGE}" alt="" />`);
    printWindow.document.write(buildProgrammationHTML(true));
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handlePDFExport = () => {
    const moisLabel = MOIS_NOMS[exportMois - 1];
    const montantEnLettres = `${numberToFrenchWords(Math.floor(total))} Francs Congolais`;
    exportProgrammationPDF({
      rows: filteredRows.map(r => ({ libelle: r.libelle || '', montant: Number(r.montant || 0) })),
      moisLabel,
      annee: exportAnnee,
      dateProgrammation,
      nomDAF: nomDAF.trim() || defaultDAF || '____________________',
      nomDP: nomDP.trim() || defaultDP || '____________________',
      montantEnLettres,
    });
  };

  const handleWordExport = () => {
    const moisLabel = MOIS_NOMS[exportMois - 1];
    exportToWord({
      title: `PROGRAMMATION — MOIS DE ${moisLabel.toUpperCase()} ${exportAnnee}`,
      filename: `programmation_${moisLabel.toLowerCase()}_${exportAnnee}`,
      content: buildProgrammationHTML(false),
      headerLines: [
        'République Démocratique du Congo',
        'Ministère des Finances',
        'Direction Générale des Douanes et Accises',
        'Direction Provinciale de Kinshasa',
      ],
    });
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="Rapport Programmation"
        description="PROGRAMATION DES DEPENSES — format officiel DGDA"
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
              <Select value={selectedAnnee} onValueChange={setSelectedAnnee}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['2022', '2023', '2024', '2025', '2026'].map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par libellé..."
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => { setExportMois(selectedMois); setExportAnnee(selectedAnnee); setExportDialogOpen(true); }} className="ml-auto gap-2">
              <FileDown className="w-4 h-4" />
              Exporter Rapport Officiel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résumé */}
      {isLoading ? (
        <SummaryCardSkeleton />
      ) : (
        <div className="flex flex-wrap items-center gap-6 p-4 bg-primary/10 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Total programmé</p>
            <p className="text-2xl font-bold text-primary whitespace-nowrap">
              {formatMontant(total, { showCurrency: true })}
            </p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Nombre de lignes</p>
            <p className="text-2xl font-bold">{filteredRows.length}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">En lettres</p>
            <p className="text-sm font-medium capitalize">{totalInWords} Francs Congolais</p>
          </div>
        </div>
      )}

      {/* Tableau principal */}
      {isLoading ? (
        <TableSkeleton columns={3} rows={10} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              PROGRAMATION DES DEPENSES MOIS DE {MOIS_NOMS[selectedMois - 1].toUpperCase()} {selectedAnnee}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-center w-16 border-r">N°.</TableHead>
                  <TableHead className="font-bold border-r">LIBELLE</TableHead>
                  <TableHead className="font-bold text-right w-44">MONTANTS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                      Aucune programmation pour cette période
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row, i) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-bold text-center border-r">{i + 1}</TableCell>
                      <TableCell className="font-bold border-r">{row.libelle}</TableCell>
                      <TableCell className="font-bold text-right">
                        {formatMontant(Number(row.montant || 0))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {filteredRows.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="text-right font-bold border-r">MONTANTS TOTAL</TableCell>
                    <TableCell className="text-right font-bold">{formatMontant(total)}</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog d'export — inspiré du Sommaire */}
      <Dialog open={exportDialogOpen} onOpenChange={v => !v && setExportDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Exporter Programmation Officielle
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations avant d'exporter le rapport Programmation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="datePgm">Date du Rapport</Label>
              <Input
                id="datePgm"
                value={dateProgrammation}
                onChange={e => setDateProgrammation(e.target.value)}
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
                value={exportAnnee}
                onChange={e => setExportAnnee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomDAF">Sous-Directeur Chargé de l'Administration et des Finances</Label>
              <Input
                id="nomDAF"
                value={nomDAF}
                onChange={e => setNomDAF(e.target.value)}
                placeholder={defaultDAF || 'Nom du sous-directeur'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomDP">Directeur Provincial</Label>
              <Input
                id="nomDP"
                value={nomDP}
                onChange={e => setNomDP(e.target.value)}
                placeholder={defaultDP || 'Nom du directeur provincial'}
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
