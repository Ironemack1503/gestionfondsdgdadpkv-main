import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Layout, Type } from "lucide-react";
import { useOfficialReportsConfig, OfficialReportConfig } from "@/hooks/useOfficialReportsConfig";

export interface PDFExportSettings {
  // Logo settings
  useDefaultLogo: boolean;
  customLogoUrl?: string;
  showLogo: boolean;
  
  // Color settings
  headerColor: string;
  headerTextColor: string;
  alternateRowColor: string;
  borderColor: string;
  
  // Layout settings
  orientation: 'portrait' | 'landscape';
  fontSize: number;
  margins: 'normal' | 'narrow' | 'wide';
  
  // Content settings
  showWatermark: boolean;
  showFooter: boolean;
  showGenerationDate: boolean;
  
  // Custom header settings
  customHeaderLine1: string;
  customHeaderLine2: string;
  customHeaderLine3: string;
  customHeaderLine4: string;
  useCustomHeader: boolean;
  
  // Custom footer settings
  customFooterLine1: string;
  customFooterLine2: string;
  customFooterLine3: string;
  customFooterLine4: string;
  useCustomFooter: boolean;
}

export const defaultPDFSettings: PDFExportSettings = {
  useDefaultLogo: true,
  showLogo: true,
  headerColor: '#1e40af',
  headerTextColor: '#ffffff',
  alternateRowColor: '#f5f7fa',
  borderColor: '#000000',
  orientation: 'portrait',
  fontSize: 9,
  margins: 'normal',
  showWatermark: false,
  showFooter: true,
  showGenerationDate: true,
  // Default header - format officiel DGDA
  customHeaderLine1: 'République Démocratique du Congo',
  customHeaderLine2: 'Ministère des Finances',
  customHeaderLine3: 'Direction Générale des Douanes et Accises',
  customHeaderLine4: 'Direction Provinciale de Kin Ville',
  useCustomHeader: false,
  // Default footer
  customFooterLine1: 'Direction Générale des Douanes et Accises',
  customFooterLine2: 'Tél: +243 81 234 5678 | Email: dgda.kv@finances.gouv.cd',
  customFooterLine3: 'Site web: www.dgda.finances.gouv.cd',
  customFooterLine4: 'Adresse: Avenue de la Douane, Kinshasa, RDC',
  useCustomFooter: false,
};

interface PDFExportConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (settings: PDFExportSettings) => void;
  title?: string;
  initialSettings?: PDFExportSettings;
}

/** Convertit OfficialReportConfig vers PDFExportSettings */
function configToSettings(config: OfficialReportConfig): PDFExportSettings {
  return {
    ...defaultPDFSettings,
    showLogo: config.showLogo,
    headerColor: config.headerColor,
    headerTextColor: '#ffffff',
    alternateRowColor: config.alternateRowColor,
    borderColor: config.borderColor,
    orientation: config.orientation,
    fontSize: config.textSize,
    showFooter: true,
    showGenerationDate: true,
    customHeaderLine1: config.headerLine1,
    customHeaderLine2: config.headerLine2,
    customHeaderLine3: config.headerLine3,
    customHeaderLine4: config.headerLine4,
    customFooterLine1: config.footerLine1,
    customFooterLine2: config.footerLine2,
    customFooterLine3: config.footerLine3,
    customFooterLine4: config.footerLine4,
  };
}

export function PDFExportConfigDialog({
  open,
  onOpenChange,
  onExport,
  title = "Configuration de l'export PDF",
  initialSettings,
}: PDFExportConfigDialogProps) {
  const { configs } = useOfficialReportsConfig();
  const officialConfig = configs.feuilleCaisse;
  
  const [settings, setSettings] = useState<PDFExportSettings>(
    initialSettings || configToSettings(officialConfig)
  );

  // Sync with official config on open
  useEffect(() => {
    if (open && !initialSettings) {
      setSettings(configToSettings(officialConfig));
    }
  }, [open, officialConfig, initialSettings]);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleExport = () => {
    onExport(settings);
    onOpenChange(false);
  };

  const resetToDefaults = () => {
    setSettings(configToSettings(officialConfig));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Personnalisez l'apparence de vos exports PDF — Format officiel DGDA
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="layout" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Mise en page
            </TabsTrigger>
            <TabsTrigger value="header-footer" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              En-tête / Pied
            </TabsTrigger>
          </TabsList>

          <TabsContent value="layout" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orientation">Orientation</Label>
                <Select
                  value={settings.orientation}
                  onValueChange={(value: 'portrait' | 'landscape') =>
                    setSettings(prev => ({ ...prev, orientation: value }))
                  }
                >
                  <SelectTrigger id="orientation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Paysage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-size">Taille de police</Label>
                <Select
                  value={settings.fontSize.toString()}
                  onValueChange={(value) =>
                    setSettings(prev => ({ ...prev, fontSize: parseInt(value) }))
                  }
                >
                  <SelectTrigger id="font-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Très petit (7pt)</SelectItem>
                    <SelectItem value="8">Petit (8pt)</SelectItem>
                    <SelectItem value="9">Normal (9pt)</SelectItem>
                    <SelectItem value="10">Grand (10pt)</SelectItem>
                    <SelectItem value="11">Très grand (11pt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label className="text-base">Options</Label>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Afficher le logo DGDA</Label>
                  <p className="text-sm text-muted-foreground">
                    Logo officiel centré dans l'en-tête
                  </p>
                </div>
                <Switch
                  checked={settings.showLogo}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, showLogo: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Pied de page</Label>
                  <p className="text-sm text-muted-foreground">
                    Inclure les informations de contact DGDA
                  </p>
                </div>
                <Switch
                  checked={settings.showFooter}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, showFooter: checked }))
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="header-footer" className="space-y-4 mt-4">
            {/* En-tête */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">En-tête officiel</Label>
              <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label htmlFor="header-line1">Ligne 1 (italique)</Label>
                  <Input
                    id="header-line1"
                    value={settings.customHeaderLine1}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, customHeaderLine1: e.target.value }))
                    }
                    placeholder="République Démocratique du Congo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="header-line2">Ligne 2</Label>
                  <Input
                    id="header-line2"
                    value={settings.customHeaderLine2}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, customHeaderLine2: e.target.value }))
                    }
                    placeholder="Ministère des Finances"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="header-line3">Ligne 3</Label>
                  <Input
                    id="header-line3"
                    value={settings.customHeaderLine3}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, customHeaderLine3: e.target.value }))
                    }
                    placeholder="Direction Générale des Douanes et Accises"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="header-line4">Ligne 4 (direction provinciale)</Label>
                  <Input
                    id="header-line4"
                    value={settings.customHeaderLine4}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, customHeaderLine4: e.target.value }))
                    }
                    placeholder="Direction Provinciale de Kin Ville"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4" />

            {/* Pied de page */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Pied de page</Label>
              <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label htmlFor="footer-line1">Ligne 1</Label>
                  <Input
                    id="footer-line1"
                    value={settings.customFooterLine1}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, customFooterLine1: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-line2">Ligne 2</Label>
                  <Input
                    id="footer-line2"
                    value={settings.customFooterLine2}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, customFooterLine2: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-line3">Ligne 3</Label>
                  <Input
                    id="footer-line3"
                    value={settings.customFooterLine3}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, customFooterLine3: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-line4">Ligne 4</Label>
                  <Input
                    id="footer-line4"
                    value={settings.customFooterLine4}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, customFooterLine4: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            Réinitialiser
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleExport}>
              <FileText className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
