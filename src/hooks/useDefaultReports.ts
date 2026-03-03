/**
 * Hook personnalisé pour gérer les rapports par défaut
 * Fournit un accès centralisé aux trois rapports officiels DGDA
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  DEFAULT_REPORTS, 
  EXPORT_CONFIG, 
  ReportType, 
  DefaultReport,
  getDefaultReports,
  isDefaultReport,
  getDefaultReportById,
  getAvailableExportFormats
} from '@/config/defaultReports';
import { useToast } from '@/hooks/use-toast';

export interface UseDefaultReportsReturn {
  /** Liste complète des rapports par défaut */
  reports: DefaultReport[];
  
  /** Rapport actuellement sélectionné */
  selectedReport: ReportType;
  
  /** Change le rapport sélectionné */
  setSelectedReport: (reportId: ReportType) => void;
  
  /** Obtient les détails d'un rapport */
  getReport: (reportId: ReportType) => DefaultReport | undefined;
  
  /** Vérifie si un rapport est autorisé pour l'export */
  canExport: (reportId?: string) => boolean;
  
  /** Formats d'export disponibles pour le rapport sélectionné */
  availableFormats: ('pdf' | 'excel' | 'word')[];
  
  /** Configuration d'export globale */
  exportConfig: typeof EXPORT_CONFIG;
  
  /** Affiche un message d'erreur si export non autorisé */
  showRestrictionMessage: () => void;
}

/**
 * Hook pour gérer les rapports par défaut dans l'application
 * 
 * @example
 * ```tsx
 * const { reports, selectedReport, setSelectedReport, canExport } = useDefaultReports();
 * 
 * // Vérifier si un rapport peut être exporté
 * if (canExport('feuille-caisse')) {
 *   // Procéder à l'export
 * }
 * 
 * // Obtenir la liste des rapports
 * reports.forEach(report => console.log(report.name));
 * ```
 */
export function useDefaultReports(): UseDefaultReportsReturn {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<ReportType>(
    EXPORT_CONFIG.defaultSelectedReport
  );

  // Liste des rapports disponibles
  const reports = useMemo(() => getDefaultReports(), []);

  // Formats disponibles pour le rapport sélectionné
  const availableFormats = useMemo(
    () => getAvailableExportFormats(selectedReport),
    [selectedReport]
  );

  // Obtient un rapport par ID
  const getReport = useCallback((reportId: ReportType) => {
    return getDefaultReportById(reportId);
  }, []);

  // Vérifie si un rapport peut être exporté
  const canExport = useCallback((reportId?: string) => {
    // Si la restriction est activée
    if (EXPORT_CONFIG.restrictToDefaultReports) {
      // Vérifier que c'est un rapport par défaut
      return reportId ? isDefaultReport(reportId) : true;
    }
    // Sinon, autoriser tous les exports
    return true;
  }, []);

  // Affiche le message de restriction
  const showRestrictionMessage = useCallback(() => {
    toast({
      title: 'Export restreint',
      description: EXPORT_CONFIG.restrictionMessage,
      variant: 'destructive',
    });
  }, [toast]);

  return {
    reports,
    selectedReport,
    setSelectedReport,
    getReport,
    canExport,
    availableFormats,
    exportConfig: EXPORT_CONFIG,
    showRestrictionMessage,
  };
}

/**
 * Hook simplifié pour obtenir uniquement la liste des rapports
 */
export function useReportsList() {
  return useMemo(() => getDefaultReports(), []);
}

/**
 * Hook pour vérifier si un rapport est valide
 */
export function useIsDefaultReport(reportId?: string): boolean {
  return useMemo(
    () => (reportId ? isDefaultReport(reportId) : false),
    [reportId]
  );
}
