/**
 * Composant de sélection de rapport par défaut
 * Permet de choisir parmi les trois rapports officiels DGDA
 */

import { FileSpreadsheet, FileText, Calendar, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDefaultReports } from "@/hooks/useDefaultReports";
import { ReportType } from "@/config/defaultReports";

interface DefaultReportSelectorProps {
  /** Fonction appelée quand un rapport est sélectionné */
  onSelectReport?: (reportId: ReportType) => void;
  /** Afficher en mode compact */
  compact?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
}

const REPORT_ICONS: Record<ReportType, React.ComponentType<{ className?: string }>> = {
  'feuille-caisse': FileSpreadsheet,
  'sommaire': FileText,
  'programmation': Calendar,
};

/**
 * Composant pour sélectionner un rapport par défaut parmi les trois rapports officiels
 */
export function DefaultReportSelector({ 
  onSelectReport, 
  compact = false,
  className 
}: DefaultReportSelectorProps) {
  const { reports, selectedReport, setSelectedReport } = useDefaultReports();

  const handleSelect = (reportId: ReportType) => {
    setSelectedReport(reportId);
    onSelectReport?.(reportId);
  };

  if (compact) {
    return (
      <div className={cn("flex gap-2", className)}>
        {reports.map((report) => {
          const Icon = REPORT_ICONS[report.id];
          const isSelected = selectedReport === report.id;
          
          return (
            <Button
              key={report.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleSelect(report.id)}
              className={cn(
                "flex-1",
                isSelected && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <Icon className="h-4 w-4 mr-2" />
              {report.name}
              {isSelected && <Check className="h-4 w-4 ml-2" />}
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      {reports.map((report) => {
        const Icon = REPORT_ICONS[report.id];
        const isSelected = selectedReport === report.id;
        
        return (
          <Card
            key={report.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg",
              isSelected && "ring-2 ring-primary border-primary"
            )}
            onClick={() => handleSelect(report.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={cn(
                  "p-3 rounded-lg",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10"
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                {isSelected && (
                  <Badge variant="default" className="gap-1">
                    <Check className="h-3 w-3" />
                    Sélectionné
                  </Badge>
                )}
              </div>
              <CardTitle className="mt-4">{report.name}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">Rapport officiel</Badge>
                <span className="text-xs">
                  {report.exportFormats.length} formats
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Variante simple sous forme de liste
 */
export function DefaultReportSelectorList({ 
  onSelectReport,
  className 
}: DefaultReportSelectorProps) {
  const { reports, selectedReport, setSelectedReport } = useDefaultReports();

  const handleSelect = (reportId: ReportType) => {
    setSelectedReport(reportId);
    onSelectReport?.(reportId);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {reports.map((report) => {
        const Icon = REPORT_ICONS[report.id];
        const isSelected = selectedReport === report.id;
        
        return (
          <div
            key={report.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all",
              isSelected 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            )}
            onClick={() => handleSelect(report.id)}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-md",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{report.name}</p>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </div>
            </div>
            {isSelected && (
              <Badge variant="default">
                <Check className="h-3 w-3 mr-1" />
                Sélectionné
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
