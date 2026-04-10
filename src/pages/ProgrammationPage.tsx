import { useState, useMemo } from "react";
import { Plus, Search, Edit, Trash2, Loader2, FileDown, FileSpreadsheet, Settings, Pencil } from "lucide-react";
import { formatMontant } from "@/lib/utils";
import { TableSkeleton, SummaryCardSkeleton } from "@/components/shared/Skeletons";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProgrammations, Programmation } from "@/hooks/useProgrammations";
import { useLocalUserRole } from "@/hooks/useLocalUserRole";
import { exportToExcel } from "@/lib/exportUtils";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import dgdaLogo from "@/assets/dgda-logo-new.jpg";

// Custom footer text for DGDA
const DGDA_FOOTER_LINE1 = "Tous mobilisés pour une douane d'action et d'excellence !";
const DGDA_FOOTER_LINE2 = "Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe";
const DGDA_FOOTER_LINE3 = "B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215 N.I.F. : A0700230J";
const DGDA_FOOTER_LINE4 = "Email : info@douane.gouv.cd ; contact@douane.gouv.cd ; courier.dgda@douane.gouv.cd - Web : https://www.douanes.gouv.cd";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const years = [2022, 2023, 2024, 2025, currentYear, currentYear + 1].filter((v, i, a) => a.indexOf(v) === i).sort();
const months = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
];

// Convert number to French words
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

export default function ProgrammationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'list' | 'edit'>('list');
  const [editSearchQuery, setEditSearchQuery] = useState("");
  const [selectedMois, setSelectedMois] = useState(String(currentMonth));
  const [selectedAnnee, setSelectedAnnee] = useState(String(currentYear));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'excel'>('pdf');
  const [editingProgrammation, setEditingProgrammation] = useState<Programmation | null>(null);
  const [formData, setFormData] = useState({
    libelle: "",
    montantPrevu: "",
  });
  const [exportSettings, setExportSettings] = useState({
    programmationName: "",
    directionProvinciale: "Direction Provinciale Kin - Ville",
    referenceNumber: "",
    sousDirecteurTitre: "LE SOUS-DIRECTEUR CHARGE DE L'ADMINISTRATION ET DES FINANCES",
    sousDirecteurNom: "KABOMBO BADIABIABO",
    directeurTitre: "LE DIRECTEUR PROVINCIAL",
    directeurNom: "KALALA MASIMANGO",
    lieuSignature: "Kinshasa",
    exportMode: "merged" as "own" | "merged",
  });

  const { programmations, isLoading, formatMois, moisNoms, createProgrammation, updateProgrammation, deleteProgrammation } = useProgrammations(parseInt(selectedMois), parseInt(selectedAnnee));
  const { isAdmin, isInstructeur } = useLocalUserRole();

  const canManage = isAdmin || isInstructeur;

  // Filter by search query (data already filtered by month/year from hook)
  const filteredProgrammations = useMemo(() => {
    if (!searchQuery.trim()) return programmations;
    return programmations.filter(
      (p) => (p.libelle || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [programmations, searchQuery]);

  // Export uses all programmations for the month
  const getExportProgrammations = programmations;

  const handleOpenCreate = () => {
    setEditingProgrammation(null);
    setFormData({ libelle: "", montantPrevu: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (prog: Programmation) => {
    setEditingProgrammation(prog);
    setFormData({
      libelle: prog.libelle || '',
      montantPrevu: String(prog.montant || 0),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProgrammation) {
      await updateProgrammation.mutateAsync({
        id: editingProgrammation.id,
        libelle: formData.libelle,
        montant: parseFloat(formData.montantPrevu),
      });
    } else {
      await createProgrammation.mutateAsync({
        mois: parseInt(selectedMois),
        annee: parseInt(selectedAnnee),
        libelle: formData.libelle,
        montant: parseFloat(formData.montantPrevu),
      });
    }

    setFormData({ libelle: "", montantPrevu: "" });
    setEditingProgrammation(null);
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette programmation ?")) {
      await deleteProgrammation.mutateAsync(id);
    }
  };

  const filteredTotal = filteredProgrammations.reduce((acc, p) => acc + Number(p.montant || 0), 0);
  const totalInWords = numberToFrenchWords(Math.floor(filteredTotal));

  const openExportDialog = (type: 'pdf' | 'excel') => {
    setExportType(type);
    setIsExportDialogOpen(true);
  };

  // Custom PDF export with logo and signatures - format administratif officiel DGDA
  const handleExportPDF = async () => {
    const mois = parseInt(selectedMois);
    const annee = parseInt(selectedAnnee);
    const moisLabel = moisNoms[mois - 1];
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Use export programmations based on mode
    const exportData = getExportProgrammations;
    const exportTotal = exportData.reduce((acc, p) => acc + Number(p.montant || 0), 0);
    
    // Format centimes
    const totalEntier = Math.floor(exportTotal);
    const centimes = Math.round((exportTotal - totalEntier) * 100);
    const exportTotalInWords = numberToFrenchWords(totalEntier);
    const centimesInWords = centimes > 0 ? ` et ${numberToFrenchWords(centimes)} centimes` : '';

    // ============= EN-TÊTE OFFICIEL =============
    // Titre institutionnel centré en majuscules
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.text('REPUBLIQUE DEMOCRATIQUE DU CONGO', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    doc.text('MINISTERE DES FINANCES', pageWidth / 2, 22, { align: 'center' });
    
    doc.setFont('times', 'bold');
    doc.text('DIRECTION GENERALE DES DOUANES ET ACCISES', pageWidth / 2, 29, { align: 'center' });

    // Ligne de séparation
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(14, 34, pageWidth - 14, 34);

    // Référence à gauche et nom programmation à droite
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    const refNumber = exportSettings.referenceNumber || '';
    doc.text(`DGDA/3400/DP/KV/SDAF/${refNumber}        ${annee}`, 14, 42);
    
    // Nom de la programmation à droite (ex: PROGRAMMATION EVE)
    if (exportSettings.programmationName) {
      doc.setFont('times', 'bold');
      doc.text(`PROGRAMMATION ${exportSettings.programmationName.toUpperCase()}`, pageWidth - 14, 42, { align: 'right' });
    }

    // ============= TITRE PRINCIPAL =============
    doc.setFontSize(13);
    doc.setFont('times', 'bold');
    doc.text(`PROGRAMMATION DES DEPENSES MOIS DE ${moisLabel.toUpperCase()} / ${annee}`, pageWidth / 2, 55, { align: 'center' });

    // ============= TABLEAU PRINCIPAL =============
    // Prepare table data
    const tableData = exportData.map((p, index) => [
      String(p.numero || index + 1),
      p.libelle || '',
      Number(p.montant || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ]);

    // Add table with official styling
    autoTable(doc, {
      head: [['N°', 'LIBELLÉ', 'MONTANT']],
      body: tableData,
      startY: 62,
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 9,
        fontStyle: 'bold',
        cellPadding: 1,
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        textColor: [0, 0, 0],
        overflow: 'ellipsize',
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.4,
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
      },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center' },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { cellWidth: 40, halign: 'right' },
      },
      margin: { left: 5, right: 5 },
    });

    // Get final Y position after table
    let finalY = (doc as any).lastAutoTable.finalY;

    // ============= TOTAL GÉNÉRAL =============
    finalY += 5;
    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.text(`MONTANT TOTAL : ${exportTotal.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC`, pageWidth - 14, finalY, { align: 'right' });

    // ============= MONTANT EN LETTRES =============
    finalY += 10;
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    const montantLettres = `Nous disons : Francs Congolais :\n${exportTotalInWords.charAt(0).toUpperCase() + exportTotalInWords.slice(1)}${centimesInWords}.`;
    const montantLettresLines = doc.splitTextToSize(montantLettres, pageWidth - 28);
    doc.text(montantLettresLines, 14, finalY);
    finalY += montantLettresLines.length * 5;

    // Check if we need a new page for signatures
    if (finalY > pageHeight - 70) {
      doc.addPage();
      finalY = 30;
    }

    // ============= ZONE DE SIGNATURE =============
    finalY += 15;
    
    // Date et lieu (aligné à droite)
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text(`Fait à ${exportSettings.lieuSignature}, le ${dateStr}`, pageWidth - 14, finalY, { align: 'right' });

    finalY += 15;
    
    // Colonnes de signature
    const leftColX = 14;
    const rightColX = pageWidth / 2 + 10;
    const colWidth = (pageWidth - 28) / 2 - 10;

    // Signature gauche (Sous-Directeur)
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    const leftTitleLines = doc.splitTextToSize(exportSettings.sousDirecteurTitre.toUpperCase(), colWidth);
    doc.text(leftTitleLines, leftColX, finalY);
    
    // Nom du signataire gauche
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    const leftNameY = finalY + (leftTitleLines.length * 5) + 20;
    doc.text(exportSettings.sousDirecteurNom.toUpperCase(), leftColX, leftNameY);

    // Signature droite (Directeur)
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    const rightTitleLines = doc.splitTextToSize(exportSettings.directeurTitre.toUpperCase(), colWidth);
    doc.text(rightTitleLines, rightColX, finalY);
    
    // Nom du signataire droit
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    const rightNameY = finalY + (rightTitleLines.length * 5) + 20;
    doc.text(exportSettings.directeurNom.toUpperCase(), rightColX, rightNameY);

    // ============= PIED DE PAGE =============
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Numéro de page en bas
      doc.setFontSize(9);
      doc.setFont('times', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // Generate filename with programmation name if provided
    const nameSuffix = exportSettings.programmationName ? `_${exportSettings.programmationName.toLowerCase()}` : '';
    doc.save(`programmation${nameSuffix}_${moisLabel.toLowerCase()}_${annee}.pdf`);
    setIsExportDialogOpen(false);
  };

  const handleExportExcel = () => {
    const mois = parseInt(selectedMois);
    const annee = parseInt(selectedAnnee);
    const moisLabel = moisNoms[mois - 1];
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Use export programmations based on mode
    const dataToExport = getExportProgrammations;
    const exportTotal = dataToExport.reduce((acc, p) => acc + Number(p.montant || 0), 0);
    
    // Format centimes
    const totalEntier = Math.floor(exportTotal);
    const centimes = Math.round((exportTotal - totalEntier) * 100);
    const exportTotalInWords = numberToFrenchWords(totalEntier);
    const centimesInWords = centimes > 0 ? ` et ${numberToFrenchWords(centimes)} centimes` : '';

    const exportDataRows = dataToExport.map((p, index) => ({
      numero: p.numero || index + 1,
      libelle: p.libelle || '',
      montant: Number(p.montant || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    }));

    // Add total row
    exportDataRows.push({
      numero: '' as any,
      libelle: 'MONTANT TOTAL',
      montant: exportTotal.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' FC',
    });

    // Create programmation title
    const progTitle = exportSettings.programmationName 
      ? `PROGRAMMATION ${exportSettings.programmationName.toUpperCase()}`
      : '';

    const nameSuffix = exportSettings.programmationName ? `_${exportSettings.programmationName.toLowerCase()}` : '';
    const refNumber = exportSettings.referenceNumber || '';

    exportToExcel({
      title: `PROGRAMMATION DES DEPENSES MOIS DE ${moisLabel.toUpperCase()} / ${annee}`,
      filename: `programmation${nameSuffix}_${moisLabel.toLowerCase()}_${annee}`,
      subtitle: `Nous disons : Francs Congolais : ${exportTotalInWords.charAt(0).toUpperCase() + exportTotalInWords.slice(1)}${centimesInWords}.`,
      columns: [
        { header: 'N°', key: 'numero', width: 10 },
        { header: 'LIBELLÉ', key: 'libelle', width: 60 },
        { header: 'MONTANT', key: 'montant', width: 25 },
      ],
      data: exportDataRows,
      headerLines: [
        'REPUBLIQUE DEMOCRATIQUE DU CONGO',
        'MINISTERE DES FINANCES',
        'DIRECTION GENERALE DES DOUANES ET ACCISES',
        '',
        `DGDA/3400/DP/KV/SDAF/${refNumber}        ${annee}                    ${progTitle}`,
      ],
      footerLines: [
        '',
        `Fait à ${exportSettings.lieuSignature}, le ${dateStr}`,
        '',
        `${exportSettings.sousDirecteurTitre.toUpperCase()}                    ${exportSettings.directeurTitre.toUpperCase()}`,
        '',
        `${exportSettings.sousDirecteurNom.toUpperCase()}                    ${exportSettings.directeurNom.toUpperCase()}`,
      ],
    });
    setIsExportDialogOpen(false);
  };

  const handleExport = () => {
    if (exportType === 'pdf') {
      handleExportPDF();
    } else {
      handleExportExcel();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programmation Mensuelle"
        description="Planifiez les dépenses prévues pour chaque mois"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => openExportDialog('pdf')}>
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => openExportDialog('excel')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            {canManage && (
              <>
                <Button
                  variant={activeTab === 'edit' ? 'default' : 'outline'}
                  onClick={() => setActiveTab(activeTab === 'edit' ? 'list' : 'edit')}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Modifier programmation
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleOpenCreate}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle programmation
                    </Button>
                  </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProgrammation ? 'Modifier la programmation' : 'Créer une programmation'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProgrammation 
                        ? 'Modifiez les informations de cette ligne de programmation'
                        : `Ajouter une ligne à la programmation de ${moisNoms[parseInt(selectedMois) - 1]} ${selectedAnnee}`
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="libelle">Libellé *</Label>
                      <Input
                        id="libelle"
                        placeholder="Ex: Achat matériels électriques"
                        value={formData.libelle}
                        onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="montantPrevu">Montant (FC) *</Label>
                      <Input
                        id="montantPrevu"
                        type="number"
                        placeholder="0"
                        value={formData.montantPrevu}
                        onChange={(e) => setFormData({ ...formData, montantPrevu: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={createProgrammation.isPending || updateProgrammation.isPending}>
                        {(createProgrammation.isPending || updateProgrammation.isPending) && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        {editingProgrammation ? 'Mettre à jour' : 'Créer'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              </>
            )}
          </div>
        }
      />

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuration de l'export {exportType.toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Configurez les informations du document avant l'export
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Document info */}
            <div className="space-y-4 p-4 sm:p-6 border rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm">Informations du document</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="programmationName">Nom de la programmation</Label>
                  <Input
                    id="programmationName"
                    placeholder="Ex: EVE, LUMUMBA"
                    value={exportSettings.programmationName}
                    onChange={(e) => setExportSettings({...exportSettings, programmationName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">N° de référence</Label>
                  <Input
                    id="referenceNumber"
                    placeholder="Ex: 001"
                    value={exportSettings.referenceNumber}
                    onChange={(e) => setExportSettings({...exportSettings, referenceNumber: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="directionProvinciale">Direction Provinciale</Label>
                  <Input
                    id="directionProvinciale"
                    value={exportSettings.directionProvinciale}
                    onChange={(e) => setExportSettings({...exportSettings, directionProvinciale: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lieuSignature">Lieu de signature</Label>
                  <Input
                    id="lieuSignature"
                    value={exportSettings.lieuSignature}
                    onChange={(e) => setExportSettings({...exportSettings, lieuSignature: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* First signatory */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm">Premier signataire</h4>
              <div className="space-y-2">
                <Label htmlFor="sousDirecteurTitre">Titre / Qualité</Label>
                <Input
                  id="sousDirecteurTitre"
                  value={exportSettings.sousDirecteurTitre}
                  onChange={(e) => setExportSettings({...exportSettings, sousDirecteurTitre: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sousDirecteurNom">Nom</Label>
                <Input
                  id="sousDirecteurNom"
                  value={exportSettings.sousDirecteurNom}
                  onChange={(e) => setExportSettings({...exportSettings, sousDirecteurNom: e.target.value})}
                />
              </div>
            </div>
            
            {/* Second signatory */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm">Deuxième signataire</h4>
              <div className="space-y-2">
                <Label htmlFor="directeurTitre">Titre / Qualité</Label>
                <Input
                  id="directeurTitre"
                  value={exportSettings.directeurTitre}
                  onChange={(e) => setExportSettings({...exportSettings, directeurTitre: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="directeurNom">Nom</Label>
                <Input
                  id="directeurNom"
                  value={exportSettings.directeurNom}
                  onChange={(e) => setExportSettings({...exportSettings, directeurNom: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleExport}>
              {exportType === 'pdf' ? <FileDown className="w-4 h-4 mr-2" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
              Exporter en {exportType.toUpperCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Mois:</Label>
          <Select value={selectedMois} onValueChange={setSelectedMois}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Année:</Label>
          <Select value={selectedAnnee} onValueChange={setSelectedAnnee}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
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
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Summary */}
      {isLoading ? (
        <SummaryCardSkeleton />
      ) : (
        <div className="flex items-center gap-6 p-4 bg-primary/10 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Total programmé</p>
            <p className="text-2xl font-bold text-primary whitespace-nowrap">
              {formatMontant(filteredTotal, { showCurrency: true })}
            </p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Nombre de lignes</p>
            <p className="text-2xl font-bold">{filteredProgrammations.length}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">En lettres</p>
            <p className="text-sm font-medium capitalize">{totalInWords} Francs Congolais</p>
          </div>
        </div>
      )}

      {/* Panneau Rechercher & Modifier */}
      {activeTab === 'edit' && canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pencil className="w-5 h-5" />
              Rechercher & Modifier une programmation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par libellé pour modifier..."
                  className="pl-10"
                  value={editSearchQuery}
                  onChange={(e) => setEditSearchQuery(e.target.value)}
                />
              </div>
              {editSearchQuery.trim() && (
                <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[60px] font-semibold">N°</TableHead>
                        <TableHead className="font-semibold">Libellé</TableHead>
                        <TableHead className="text-right font-semibold w-[150px]">Montant (FC)</TableHead>
                        <TableHead className="w-[100px] font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProgrammations
                        .filter(p => (p.libelle || '').toLowerCase().includes(editSearchQuery.toLowerCase()))
                        .map((prog, index) => (
                          <TableRow key={prog.id}>
                            <TableCell className="font-medium">{prog.numero || index + 1}</TableCell>
                            <TableCell>{prog.libelle}</TableCell>
                            <TableCell className="text-right font-semibold whitespace-nowrap">
                              {formatMontant(prog.montant || 0)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEdit(prog)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Modifier
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleDelete(prog.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      {filteredProgrammations.filter(p => (p.libelle || '').toLowerCase().includes(editSearchQuery.toLowerCase())).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            Aucune programmation trouvée
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton columns={4} rows={6} />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px] font-semibold">N°</TableHead>
                <TableHead className="font-semibold">Libellé</TableHead>
                <TableHead className="text-right font-semibold w-[180px]">Montant (FC)</TableHead>
                {canManage && <TableHead className="w-[100px] font-semibold">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProgrammations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 4 : 3} className="text-center py-8 text-muted-foreground">
                    Aucune programmation pour ce mois
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredProgrammations.map((prog, index) => (
                    <TableRow key={prog.id}>
                      <TableCell className="font-medium">{prog.numero || index + 1}</TableCell>
                      <TableCell>{prog.libelle}</TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap">
                        {formatMontant(prog.montant || 0)}
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleOpenEdit(prog)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDelete(prog.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {/* Total row */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell></TableCell>
                    <TableCell className="text-right">MONTANT TOTAL</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatMontant(filteredTotal)}
                    </TableCell>
                    {canManage && <TableCell></TableCell>}
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
