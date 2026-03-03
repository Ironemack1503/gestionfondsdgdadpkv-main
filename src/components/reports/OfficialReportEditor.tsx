/**
 * Éditeur pour configurer les rapports officiels DGDA
 * Interface côte à côte : éditeur à gauche, aperçu en temps réel à droite
 */

import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useOfficialReportsConfig, OfficialReportConfig, ReportColumn } from '@/hooks/useOfficialReportsConfig';
import { ProgrammationOfficielReport } from './ProgrammationOfficielReport';
import { FeuilleCaisseOfficielReport } from './FeuilleCaisseOfficielReport';
import { SommaireOfficielReport } from './SommaireOfficielReport';
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';
import { 
  RotateCcw,
  Save,
  Download,
  Upload,
  Eye,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Monitor,
  GripVertical,
  X,
  Plus
} from 'lucide-react';

interface OfficialReportEditorProps {
  reportType: 'programmation' | 'feuilleCaisse' | 'sommaire';
  reportName: string;
}

const moisNoms = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Données de démonstration - Programmation des Dépenses
const DEMO_DATA_PROGRAMMATION = [
  { numero: 1, libelle: "Paiement facture IX Service ramassage des immondices au Guichet-Unique(Mois d'Octobre)", montant: 253000 },
  { numero: 2, libelle: "Frais d'approvisionnement Frigo bureaux", montant: 1260000 },
  { numero: 3, libelle: "Frais de salubrité de la cour", montant: 160000 },
];

// Données de démonstration - Feuille de Caisse
const DEMO_DATA_FEUILLE_CAISSE = [
  { date: '01/12/2025', numeroOrdre: 1, numeroBEO: '0', libelle: 'Solde du 30/11/2025', recette: 13339676.96, imp: '707820' },
  { date: '01/12/2025', numeroOrdre: 2, numeroBEO: '1951', libelle: 'Remplacement ampoules,achat fusible,socket', depense: 240500.00, imp: '605200' },
  { date: '01/12/2025', numeroOrdre: 3, numeroBEO: '1952', libelle: 'Achat courroies Jeep 7252', depense: 150000.00, imp: '624000' },
  { date: '02/12/2025', numeroOrdre: 4, numeroBEO: '1898', libelle: 'Achat registres indicateurs', depense: 850000.00, imp: '604710' },
  { date: '02/12/2025', numeroOrdre: 5, numeroBEO: '1897', libelle: 'Achat sept 7eurs HP', depense: 2585000.00, imp: '605200' },
  { date: '02/12/2025', numeroOrdre: 6, numeroBEO: '1898', libelle: 'Intervention sces extérieurs axe Mitendi', depense: 1500000.00, imp: '659800' },
  { date: '02/12/2025', numeroOrdre: 7, numeroBEO: '1899', libelle: 'Achat carburant sce déchargement', depense: 1065000.00, imp: '604210' },
  { date: '02/12/2025', numeroOrdre: 8, numeroBEO: '1900', libelle: 'Achat rallonges bureaux', depense: 184000.00, imp: '605200' },
];

// Données de démonstration - Sommaire Mensuel
const DEMO_DATA_SOMMAIRE = [
  { article: '707820', designation: 'KV, Fonctionnement Raw Bank', recette: 60000000.00 },
  { article: '707820', designation: "KV, PV CX N° CXR", recette: 60000000.00 },
  { article: '707820', designation: "KV, PV CX ORBIT", recette: 10000000.00 },
  { article: '707820', designation: "KV, PV CX N°115/25 P/C Sté ZIHUANSI", recette: 9059400.00 },
  { article: '707820', designation: "KV, PV CX N° 130/25 P/C SUKA AFRICA", recette: 10749060.60 },
  { article: '707820', designation: "KV, Récupération Fonds social", recette: 2294668.00 },
  { article: '707820', designation: "KV, Appro caisse", recette: 50000000.00 },
  { article: '707820', designation: "KV, Fonctionnement raw Bank", recette: 60000000.00 },
  { article: '707820', designation: "KV, Fonctionnement BCDC", recette: 135201710.00 },
  { article: '707820', designation: "KV, CTX Swissta", recette: 43887128.00 },
  { article: '707820', designation: "KV, Surveillance Brallma", recette: 31789500.00 },
  { article: '', designation: 'Articles identiques', depense: 18890000.00 },
  { article: '604300', designation: "Produits d'entretien", depense: 6437500.00 },
  { article: '604710', designation: 'Fournitures de bureau', depense: 56912536.00 },
  { article: '604720', designation: 'Consommables informatiques', depense: 16765260.00 },
  { article: '605100', designation: 'Eau', depense: 3262450.00 },
  { article: '605200', designation: 'Électricité', depense: 3381070.00 },
  { article: '618120', designation: 'Déplacement', depense: 31391000.00 },
  { article: '623210', designation: 'Loyers locaux et bureaux de service', depense: 1955000.00 },
  { article: '624000', designation: 'Entretien, réparations et maintenance', depense: 40721536.00 },
  { article: '626630', designation: 'Abonnements', depense: 747500.00 },
  { article: '628100', designation: 'Frais de communications et télécommunications', depense: 10080500.00 },
  { article: '631000', designation: 'Frais bancaire', depense: 726000.00 },
  { article: '632430B', designation: 'Paiement prime contentieux', depense: 210160370.00 },
];

export function OfficialReportEditor({ 
  reportType, 
  reportName
}: OfficialReportEditorProps) {
  const { toast } = useToast();
  const { getConfig, updateConfig, resetConfig } = useOfficialReportsConfig();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const config = getConfig(reportType);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('header');
  
  // États pour le titre et période
  const [titre, setTitre] = useState(reportName.toUpperCase());
  const [selectedMois, setSelectedMois] = useState(0); // Janvier
  const [selectedAnnee, setSelectedAnnee] = useState(2024);
  const [showTotals, setShowTotals] = useState(true);
  
  // Période courante pour l'export
  const currentMonth = moisNoms[selectedMois];
  const currentYear = selectedAnnee;

  const handleUpdate = (field: keyof OfficialReportConfig, value: any) => {
    updateConfig(reportType, { [field]: value } as Partial<OfficialReportConfig>);
    setHasChanges(true);
  };

  const handleReset = () => {
    if (confirm(`Êtes-vous sûr de vouloir réinitialiser la configuration du rapport "${reportName}" ?`)) {
      resetConfig(reportType);
      setHasChanges(false);
      toast({
        title: 'Configuration réinitialisée',
        description: 'Le rapport a été restauré aux valeurs par défaut.',
      });
    }
  };

  const handleSave = () => {
    setHasChanges(false);
    toast({
      title: 'Configuration sauvegardée',
      description: 'Les modifications ont été enregistrées avec succès.',
      variant: 'default',
    });
  };

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    
    toast({ title: 'Export PDF', description: 'Génération du PDF en cours...' });
    
    // Créer une fenêtre d'impression avec le contenu du rapport
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez les paramètres de blocage des pop-ups.',
        variant: 'destructive'
      });
      return;
    }
    
    // Copier le contenu et les styles
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportName} - ${currentMonth} ${currentYear}</title>
          <style>
            ${styles}
            @media print {
              body { margin: 0; padding: 20px; }
              @page { size: A4; margin: 1cm; }
            }
          </style>
        </head>
        <body>
          ${reportRef.current.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Attendre que les images et styles se chargent
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => printWindow.close(), 100);
    }, 250);
  };

  const handleExportExcel = async () => {
    toast({ title: 'Export Excel', description: 'Génération du fichier Excel en cours...' });
    
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(reportName);
      
      // En-tête
      worksheet.mergeCells('A1:D1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = config.headerLine1 || 'DIRECTION GENERALE DES DOUANES ET ACCISES';
      titleCell.font = { name: config.titleFont, size: config.titleSize, bold: true };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      
      worksheet.mergeCells('A2:D2');
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.value = reportName;
      subtitleCell.font = { size: config.textSize + 2, bold: true };
      subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      
      // Ajouter les données selon le type de rapport
      if (reportType === 'programmation') {
        worksheet.addRow(['N° ORDRE', 'DÉSIGNATION', 'MONTANT PRÉVU']);
        DEMO_DATA_PROGRAMMATION.forEach(item => {
          worksheet.addRow([item.numero, item.libelle, item.montant]);
        });
      } else if (reportType === 'feuilleCaisse') {
        worksheet.addRow(['Date', 'N°ord', 'N°BEO', 'LIBELLE', 'RECETTE', 'DEPENSE', 'IMP']);
        DEMO_DATA_FEUILLE_CAISSE.forEach(item => {
          worksheet.addRow([
            item.date,
            item.numeroOrdre,
            item.numeroBEO,
            item.libelle,
            item.recette || '',
            item.depense || '',
            item.imp
          ]);
        });
      } else {
        worksheet.addRow(['ARTICLE', 'DÉSIGNATION', 'RECETTES', 'DÉPENSES']);
        DEMO_DATA_SOMMAIRE.forEach(item => {
          worksheet.addRow([item.article, item.designation, item.recette || '', item.depense || '']);
        });
      }
      
      // Sauvegarder
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportName}_${currentMonth}_${currentYear}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({ title: 'Succès', description: 'Fichier Excel généré avec succès!' });
    } catch (error) {
      console.error('Erreur export Excel:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Erreur lors de la génération du fichier Excel',
        variant: 'destructive'
      });
    }
  };

  const handleExportWord = () => {
    if (!reportRef.current) return;
    
    toast({ title: 'Export Word', description: 'Génération du document Word en cours...' });
    
    // Créer un HTML complet avec styles inline pour Word
    const htmlContent = `
      <!DOCTYPE html>
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${reportName}</title>
        <style>
          body { font-family: ${config.bodyFont}; font-size: ${config.textSize}pt; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid ${config.borderColor}; padding: 8px; }
          th { background-color: ${config.alternateRowColor}; font-weight: bold; }
          h1 { font-family: ${config.titleFont}; font-size: ${config.titleSize}pt; color: ${config.headerColor}; text-align: center; }
        </style>
      </head>
      <body>
        ${reportRef.current.innerHTML}
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportName}_${currentMonth}_${currentYear}.doc`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: 'Succès', description: 'Document Word généré avec succès!' });
  };

  // Données et total selon le type de rapport
  const demoData = reportType === 'programmation' 
    ? DEMO_DATA_PROGRAMMATION 
    : reportType === 'feuilleCaisse' 
    ? DEMO_DATA_FEUILLE_CAISSE 
    : DEMO_DATA_SOMMAIRE;
  
  const totalMontant = useMemo(() => {
    if (reportType === 'programmation') {
      return DEMO_DATA_PROGRAMMATION.reduce((acc, item) => acc + item.montant, 0);
    } else if (reportType === 'feuilleCaisse') {
      return DEMO_DATA_FEUILLE_CAISSE.reduce((acc, item) => acc + (item.depense || 0), 0);
    } else if (reportType === 'sommaire') {
      return DEMO_DATA_SOMMAIRE.reduce((acc, item) => acc + (item.depense || 0), 0);
    }
    return 0;
  }, [reportType]);

  const totalEnLettres = reportType === 'programmation' 
    ? "Un million six cent soixante-treize mille Francs Congolais"
    : reportType === 'feuilleCaisse'
    ? "Six cent quarante-huit millions trois cent soixante-quinze mille trois cent soixante-sept Francs Congolais"
    : "Francs Congolais: Huit millions cinquante trois mille sept cent trente quatre et quarante et un centime";

  return (
    <div className="space-y-4">
      {/* Barre d'actions supérieure */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-muted-foreground">
          Personnalisez les en-têtes, pieds de page et mise en forme de vos rapports officiels DGDA
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={handleSave} disabled={!hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Mettre à jour
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Charger
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Aperçu
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportWord}>
            <Download className="w-4 h-4 mr-2" />
            Word
          </Button>
        </div>
      </div>

      {/* Layout horizontal : Éditeur à gauche, Aperçu à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panneau d'édition à gauche */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Titre du rapport */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Titre du rapport</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="titre-principal">Titre principal</Label>
                  <Input
                    id="titre-principal"
                    value={titre}
                    onChange={(e) => {
                      setTitre(e.target.value);
                      setHasChanges(true);
                    }}
                    placeholder="PROGRAMMATION MENSUELLE"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sous-titre">Sous-titre (période)</Label>
                  <Input
                    id="sous-titre"
                    value={`MOIS DE ${moisNoms[selectedMois].toUpperCase()} ${selectedAnnee}`}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-totals">Afficher les totaux</Label>
                  <Switch
                    id="show-totals"
                    checked={showTotals}
                    onCheckedChange={setShowTotals}
                  />
                </div>
              </div>

              {/* Orientation de la page */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Orientation de la page
                </h3>
                
                <RadioGroup
                  value={config.orientation}
                  onValueChange={(value: 'portrait' | 'landscape') => handleUpdate('orientation', value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <RadioGroupItem value="portrait" id="portrait" />
                    <Label htmlFor="portrait" className="cursor-pointer flex-1">
                      <div className="border rounded p-3 text-center">
                        <FileText className="w-8 h-8 mx-auto mb-1" />
                        <span className="text-sm">Portrait</span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1">
                    <RadioGroupItem value="landscape" id="landscape" />
                    <Label htmlFor="landscape" className="cursor-pointer flex-1">
                      <div className="border rounded p-3 text-center">
                        <FileText className="w-8 h-8 mx-auto mb-1 rotate-90" />
                        <span className="text-sm">Paysage</span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Onglets de configuration */}
          <Card>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="header" className="text-xs">En-tête</TabsTrigger>
                  <TabsTrigger value="footer" className="text-xs">Pied</TabsTrigger>
                  <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
                  <TabsTrigger value="signature" className="text-xs">Sign.</TabsTrigger>
                  <TabsTrigger value="columns" className="text-xs">Col.</TabsTrigger>
                </TabsList>

                {/* Onglet En-tête */}
                <TabsContent value="header" className="space-y-4 mt-4">
                  <h3 className="font-semibold">En-tête du document</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ligne1">Ligne 1 (Pays)</Label>
                    <Input
                      id="ligne1"
                      value={config.headerLine1}
                      onChange={(e) => handleUpdate('headerLine1', e.target.value)}
                      placeholder="République Démocratique du Congo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ligne2">Ligne 2 (Ministère)</Label>
                    <Input
                      id="ligne2"
                      value={config.headerLine2}
                      onChange={(e) => handleUpdate('headerLine2', e.target.value)}
                      placeholder="Ministère des Finances"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ligne3">Ligne 3 (Direction Générale)</Label>
                    <Input
                      id="ligne3"
                      value={config.headerLine3}
                      onChange={(e) => handleUpdate('headerLine3', e.target.value)}
                      placeholder="Direction Générale des Douanes et Accises"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ligne4">Ligne 4 (Direction Provinciale)</Label>
                    <Input
                      id="ligne4"
                      value={config.headerLine4}
                      onChange={(e) => handleUpdate('headerLine4', e.target.value)}
                      placeholder="Direction Provinciale de Kin – Ville"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reference">Numéro de référence</Label>
                    <Input
                      id="reference"
                      value={config.referencePrefix}
                      onChange={(e) => handleUpdate('referencePrefix', e.target.value)}
                      placeholder="DGDA/3400/DP/KV/SDAF/"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Label htmlFor="show-logo">Afficher le logo</Label>
                    <Switch
                      id="show-logo"
                      checked={config.showLogo}
                      onCheckedChange={(checked) => handleUpdate('showLogo', checked)}
                    />
                  </div>

                  {config.showLogo && (
                    <div className="space-y-2">
                      <Label htmlFor="logo-position">Position du logo</Label>
                      <Select value="left" onValueChange={() => {}}>
                        <SelectTrigger id="logo-position">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Gauche</SelectItem>
                          <SelectItem value="center">Centre</SelectItem>
                          <SelectItem value="right">Droite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </TabsContent>

                {/* Onglet Pied de page */}
                <TabsContent value="footer" className="space-y-4 mt-4">
                  <h3 className="font-semibold">Pied de page</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="footer1">Ligne 1</Label>
                    <Input
                      id="footer1"
                      value={config.footerLine1}
                      onChange={(e) => handleUpdate('footerLine1', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footer2">Ligne 2</Label>
                    <Input
                      id="footer2"
                      value={config.footerLine2}
                      onChange={(e) => handleUpdate('footerLine2', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footer3">Ligne 3</Label>
                    <Input
                      id="footer3"
                      value={config.footerLine3}
                      onChange={(e) => handleUpdate('footerLine3', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footer4">Ligne 4</Label>
                    <Input
                      id="footer4"
                      value={config.footerLine4}
                      onChange={(e) => handleUpdate('footerLine4', e.target.value)}
                    />
                  </div>
                </TabsContent>

                {/* Onglet Style */}
                <TabsContent value="style" className="space-y-4 mt-4">
                  <h3 className="font-semibold">Style et mise en forme</h3>
                  
                  {/* Police du titre */}
                  <div className="space-y-2">
                    <Label htmlFor="titleFont">Police du titre</Label>
                    <Select
                      value={config.titleFont}
                      onValueChange={(value) => handleUpdate('titleFont', value)}
                    >
                      <SelectTrigger id="titleFont">
                        <SelectValue placeholder="Sélectionner une police" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Taille du titre */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="titleSize">Taille du titre</Label>
                      <span className="text-sm text-muted-foreground">{config.titleSize}pt</span>
                    </div>
                    <Slider
                      id="titleSize"
                      min={10}
                      max={24}
                      step={1}
                      value={[config.titleSize]}
                      onValueChange={([value]) => handleUpdate('titleSize', value)}
                      className="w-full"
                    />
                  </div>

                  {/* Police du corps */}
                  <div className="space-y-2">
                    <Label htmlFor="bodyFont">Police du corps</Label>
                    <Select
                      value={config.bodyFont}
                      onValueChange={(value) => handleUpdate('bodyFont', value)}
                    >
                      <SelectTrigger id="bodyFont">
                        <SelectValue placeholder="Sélectionner une police" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Taille du texte */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="textSize">Taille du texte</Label>
                      <span className="text-sm text-muted-foreground">{config.textSize}pt</span>
                    </div>
                    <Slider
                      id="textSize"
                      min={8}
                      max={16}
                      step={1}
                      value={[config.textSize]}
                      onValueChange={([value]) => handleUpdate('textSize', value)}
                      className="w-full"
                    />
                  </div>

                  {/* Couleurs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="headerColor">Couleur en-tête</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="headerColor"
                          type="color"
                          value={config.headerColor}
                          onChange={(e) => handleUpdate('headerColor', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={config.headerColor}
                          onChange={(e) => handleUpdate('headerColor', e.target.value)}
                          placeholder="#1e40af"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Couleur accent</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="accentColor"
                          type="color"
                          value={config.accentColor}
                          onChange={(e) => handleUpdate('accentColor', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={config.accentColor}
                          onChange={(e) => handleUpdate('accentColor', e.target.value)}
                          placeholder="#1e40af"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="alternateRowColor">Lignes alternées</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="alternateRowColor"
                          type="color"
                          value={config.alternateRowColor}
                          onChange={(e) => handleUpdate('alternateRowColor', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={config.alternateRowColor}
                          onChange={(e) => handleUpdate('alternateRowColor', e.target.value)}
                          placeholder="#f5f7fa"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="borderColor">Bordures</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="borderColor"
                          type="color"
                          value={config.borderColor}
                          onChange={(e) => handleUpdate('borderColor', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={config.borderColor}
                          onChange={(e) => handleUpdate('borderColor', e.target.value)}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Onglet Signatures */}
                <TabsContent value="signature" className="space-y-4 mt-4">
                  <h3 className="font-semibold">Signatures</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sig-title1">Fonction signataire 1</Label>
                    <Input
                      id="sig-title1"
                      value={config.signatureTitle1}
                      onChange={(e) => handleUpdate('signatureTitle1', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sig-name1">Nom signataire 1</Label>
                    <Input
                      id="sig-name1"
                      value={config.signatureName1}
                      onChange={(e) => handleUpdate('signatureName1', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sig-title2">Fonction signataire 2</Label>
                    <Input
                      id="sig-title2"
                      value={config.signatureTitle2}
                      onChange={(e) => handleUpdate('signatureTitle2', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sig-name2">Nom signataire 2</Label>
                    <Input
                      id="sig-name2"
                      value={config.signatureName2}
                      onChange={(e) => handleUpdate('signatureName2', e.target.value)}
                    />
                  </div>
                </TabsContent>

                {/* Onglet Colonnes */}
                <TabsContent value="columns" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Colonnes du tableau ({(config.columns || []).length})</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newColumn: ReportColumn = {
                          id: `col_${Date.now()}`,
                          label: 'Nouvelle colonne',
                          field: 'new_field',
                          width: 15,
                          visible: true,
                          order: (config.columns || []).length,
                        };
                        handleUpdate('columns', [...(config.columns || []), newColumn]);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Glissez pour réorganiser, cliquez sur × pour supprimer
                  </p>

                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {(config.columns || [])
                        .sort((a, b) => a.order - b.order)
                        .map((column, index) => (
                        <Card key={column.id} className="border-2">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              {/* Drag handle */}
                              <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                              
                              {/* Column info */}
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">{column.label}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {column.field} • {column.width}%
                                  </span>
                                </div>
                                
                                {/* Width slider */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs w-16">Largeur</Label>
                                    <Slider
                                      min={5}
                                      max={60}
                                      step={5}
                                      value={[column.width]}
                                      onValueChange={([value]) => {
                                        const updated = (config.columns || []).map(col => 
                                          col.id === column.id ? { ...col, width: value } : col
                                        );
                                        handleUpdate('columns', updated);
                                      }}
                                      className="flex-1"
                                    />
                                    <span className="text-xs w-10 text-right">{column.width}%</span>
                                  </div>
                                </div>

                                {/* Field and label inputs */}
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    value={column.label}
                                    onChange={(e) => {
                                      const updated = (config.columns || []).map(col => 
                                        col.id === column.id ? { ...col, label: e.target.value } : col
                                      );
                                      handleUpdate('columns', updated);
                                    }}
                                    placeholder="Libellé"
                                    className="text-xs"
                                  />
                                  <Input
                                    value={column.field}
                                    onChange={(e) => {
                                      const updated = (config.columns || []).map(col => 
                                        col.id === column.id ? { ...col, field: e.target.value } : col
                                      );
                                      handleUpdate('columns', updated);
                                    }}
                                    placeholder="Champ"
                                    className="text-xs"
                                  />
                                </div>
                              </div>

                              {/* Visibility toggle */}
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={column.visible}
                                  onCheckedChange={(checked) => {
                                    const updated = (config.columns || []).map(col => 
                                      col.id === column.id ? { ...col, visible: checked } : col
                                    );
                                    handleUpdate('columns', updated);
                                  }}
                                />
                              </div>

                              {/* Delete button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const updated = (config.columns || []).filter(col => col.id !== column.id);
                                  handleUpdate('columns', updated);
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {(!config.columns || config.columns.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune colonne configurée</p>
                      <p className="text-xs">Cliquez sur "Ajouter" pour créer une colonne</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Aperçu du document à droite */}
        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">
            Aperçu du document • {demoData.length} lignes • {config.orientation === 'portrait' ? 'Portrait' : 'Paysage'}
          </div>
          <Card className="border-2">
            <CardContent className="p-0">
              <ScrollArea className="h-[800px]">
                <div className="p-4 bg-gray-50">
                  <div className="bg-white shadow-lg" ref={reportRef}>
                    {reportType === 'programmation' && (
                      <ProgrammationOfficielReport
                        data={DEMO_DATA_PROGRAMMATION}
                        mois={moisNoms[selectedMois]}
                        annee={selectedAnnee}
                        totalEnLettres={totalEnLettres}
                        config={config}
                      />
                    )}
                    {reportType === 'feuilleCaisse' && (
                      <FeuilleCaisseOfficielReport
                        data={DEMO_DATA_FEUILLE_CAISSE}
                        mois={moisNoms[selectedMois]}
                        annee={selectedAnnee}
                        soldeInitial={13339676.96}
                        totalEnLettres={totalEnLettres}
                        config={config}
                      />
                    )}
                    {reportType === 'sommaire' && (
                      <SommaireOfficielReport
                        data={DEMO_DATA_SOMMAIRE}
                        mois={moisNoms[selectedMois]}
                        annee={selectedAnnee}
                        soldeInitial={13339676.96}
                        totalEnLettres={totalEnLettres}
                        config={config}
                      />
                    )}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
