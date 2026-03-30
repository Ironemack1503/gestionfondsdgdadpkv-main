import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Eye, Settings, FileCheck, FileType } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ExportPreviewDialog } from "./ExportPreviewDialog";
import { PDFExportConfigDialog } from "./PDFExportConfigDialog";
import { PDFExportSettings, defaultPDFSettings } from "@/lib/exportUtils";
import { useOfficialReportsConfig } from "@/hooks/useOfficialReportsConfig";
import { useDefaultReports } from "@/hooks/useDefaultReports";
import { Badge } from "@/components/ui/badge";

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExportButtonsProps {
  onExportPDF: (settings?: PDFExportSettings) => void;
  onExportExcel: (settings?: PDFExportSettings) => void;
  onExportWord?: () => void;
  disabled?: boolean;
  // Props for preview functionality
  previewTitle?: string;
  previewSubtitle?: string;
  previewColumns?: ExportColumn[];
  previewData?: Record<string, any>[];
  // Activer le sélecteur de rapport par défaut
  showDefaultReportSelector?: boolean;
  // Force l'utilisation des rapports par défaut uniquement
  restrictToDefaultReports?: boolean;
}



export function ExportButtons({ 
  onExportPDF, 
  onExportExcel,
  onExportWord, 
  disabled,
  previewTitle,
  previewSubtitle,
  previewColumns,
  previewData,
  showDefaultReportSelector = false,
  restrictToDefaultReports = false,
}: ExportButtonsProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showPDFConfig, setShowPDFConfig] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<PDFExportSettings>(defaultPDFSettings);
  
  // Charger la config officielle
  const { configs } = useOfficialReportsConfig();
  const officialConfig = configs.feuilleCaisse;
  
  // Accès aux rapports par défaut
  const { 
    reports, 
    selectedReport, 
    setSelectedReport, 
    canExport, 
    showRestrictionMessage,
    exportConfig
  } = useDefaultReports();
  
  const hasPreviewData = previewTitle && previewColumns && previewData;

  const handleExportPDFWithSettings = (settings: PDFExportSettings) => {
    if (restrictToDefaultReports && !canExport()) {
      showRestrictionMessage();
      return;
    }
    setCurrentSettings(settings);
    onExportPDF(settings);
  };

  const handleQuickExportPDF = () => {
    if (restrictToDefaultReports && !canExport()) {
      showRestrictionMessage();
      return;
    }
    onExportPDF(currentSettings);
  };

  const handleExportExcel = () => {
    if (restrictToDefaultReports && !canExport()) {
      showRestrictionMessage();
      return;
    }
    onExportExcel(currentSettings);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={disabled}>
            <FileText className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover w-72">
          {/* Section des rapports par défaut */}
          {showDefaultReportSelector && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-2">
                <FileCheck className="h-3 w-3" />
                Rapports officiels DGDA
              </DropdownMenuLabel>
              {reports.map((report) => (
                <DropdownMenuItem
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    {report.name}
                    {selectedReport === report.id && (
                      <Badge variant="default" className="text-xs">Sélectionné</Badge>
                    )}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          
          {hasPreviewData && (
            <>
              <DropdownMenuItem onClick={() => setShowPreview(true)} className="cursor-pointer">
                <Eye className="h-4 w-4 mr-2 text-primary" />
                Aperçu avant export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={handleQuickExportPDF} className="cursor-pointer">
            <FileText className="h-4 w-4 mr-2 text-destructive" />
            Export PDF rapide
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowPDFConfig(true)} className="cursor-pointer">
            <Settings className="h-4 w-4 mr-2 text-primary" />
            Export PDF personnalisé...
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
            <FileSpreadsheet className="h-4 w-4 mr-2 text-success" />
            Exporter en Excel
          </DropdownMenuItem>
          {onExportWord && (
            <DropdownMenuItem onClick={onExportWord} className="cursor-pointer">
              <FileType className="h-4 w-4 mr-2 text-blue-600" />
              Exporter en Word
            </DropdownMenuItem>
          )}
          
          {/* Indication si les exports sont restreints */}
          {restrictToDefaultReports && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  Exports limités aux rapports officiels
                </Badge>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasPreviewData && (
        <ExportPreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          title={previewTitle}
          subtitle={previewSubtitle}
          columns={previewColumns}
          data={previewData}
          onExportPDF={handleQuickExportPDF}
          onExportExcel={handleExportExcel}
        />
      )}

      <PDFExportConfigDialog
        open={showPDFConfig}
        onOpenChange={setShowPDFConfig}
        onExport={handleExportPDFWithSettings}
        title="Configuration de l'export PDF"
        initialSettings={currentSettings}
      />
    </>
  );
}
