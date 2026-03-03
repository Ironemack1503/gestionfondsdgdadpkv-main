import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Eye, Settings, Loader2, FileCheck } from "lucide-react";
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
import { useReportSettings, convertToExportSettings, ReportSettings } from "@/hooks/useReportSettings";
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

/**
 * Merges database settings with any overrides
 */
function mergeWithDbSettings(
  dbSettings: ReportSettings | null,
  overrides?: Partial<PDFExportSettings>
): PDFExportSettings {
  if (!dbSettings) {
    return { ...defaultPDFSettings, ...overrides };
  }

  const baseSettings = convertToExportSettings(dbSettings);
  return { ...baseSettings, ...overrides };
}

export function ExportButtons({ 
  onExportPDF, 
  onExportExcel, 
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
  
  // Load database report settings
  const { settings: dbSettings, isLoading: isLoadingSettings } = useReportSettings();
  
  // Accès aux rapports par défaut
  const { 
    reports, 
    selectedReport, 
    setSelectedReport, 
    canExport, 
    showRestrictionMessage,
    exportConfig
  } = useDefaultReports();
  
  // Update current settings when DB settings are loaded
  useEffect(() => {
    if (dbSettings && 'id' in dbSettings) {
      const appliedSettings = convertToExportSettings(dbSettings as ReportSettings);
      setCurrentSettings(appliedSettings);
    }
  }, [dbSettings]);
  
  const hasPreviewData = previewTitle && previewColumns && previewData;
  
  // Vérifier si l'export est autorisé selon la configuration
  const isExportAllowed = !restrictToDefaultReports || (restrictToDefaultReports && exportConfig.restrictToDefaultReports);

  const handleExportPDFWithSettings = (settings: PDFExportSettings) => {
    if (restrictToDefaultReports && !canExport()) {
      showRestrictionMessage();
      return;
    }
    // Merge user customizations with DB settings
    const mergedSettings = mergeWithDbSettings(dbSettings as ReportSettings | null, settings);
    setCurrentSettings(mergedSettings);
    onExportPDF(mergedSettings);
  };

  const handleQuickExportPDF = () => {
    if (restrictToDefaultReports && !canExport()) {
      showRestrictionMessage();
      return;
    }
    // Use DB settings merged with current settings
    const mergedSettings = mergeWithDbSettings(dbSettings as ReportSettings | null, currentSettings);
    onExportPDF(mergedSettings);
  };

  const handleExportExcel = () => {
    if (restrictToDefaultReports && !canExport()) {
      showRestrictionMessage();
      return;
    }
    // Use DB settings merged with current settings
    const mergedSettings = mergeWithDbSettings(dbSettings as ReportSettings | null, currentSettings);
    onExportExcel(mergedSettings);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={disabled || isLoadingSettings}>
            {isLoadingSettings ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
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
