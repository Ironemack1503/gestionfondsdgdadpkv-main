/**
 * Configuration centralisée des rapports par défaut
 * 
 * Les trois rapports officiels DGDA sont :
 * 1. Feuille de Caisse - Vue détaillée des opérations avec solde progressif
 * 2. Sommaire Mensuel - Synthèse des recettes et dépenses par rubrique
 * 3. Programmation - État de la programmation mensuelle des dépenses
 * 
 * Ces rapports sont les SEULS exportables dans toute l'application
 */

export type ReportType = 'feuille-caisse' | 'sommaire' | 'programmation';

export interface DefaultReport {
  id: ReportType;
  name: string;
  description: string;
  path: string;
  icon: string;
  isDefault: true;
  exportFormats: ('pdf' | 'excel' | 'word')[];
  category: 'official'; // Marqué comme rapport officiel DGDA
}

/**
 * Liste des trois rapports officiels DGDA disponibles pour l'export
 * Ces rapports sont figés et ne peuvent pas être modifiés
 */
export const DEFAULT_REPORTS: Record<ReportType, DefaultReport> = {
  'feuille-caisse': {
    id: 'feuille-caisse',
    name: 'Feuille de Caisse',
    description: 'Vue détaillée des opérations de caisse avec solde progressif',
    path: '/rapports/feuille-caisse',
    icon: 'FileSpreadsheet',
    isDefault: true,
    exportFormats: ['pdf', 'excel', 'word'],
    category: 'official',
  },
  'sommaire': {
    id: 'sommaire',
    name: 'Sommaire Mensuel',
    description: 'Synthèse des recettes et dépenses par rubrique',
    path: '/rapports/sommaire',
    icon: 'FileText',
    isDefault: true,
    exportFormats: ['pdf', 'excel', 'word'],
    category: 'official',
  },
  'programmation': {
    id: 'programmation',
    name: 'Programmation des Dépenses',
    description: 'État de la programmation mensuelle des dépenses',
    path: '/rapports/programmation',
    icon: 'Calendar',
    isDefault: true,
    exportFormats: ['pdf', 'excel', 'word'],
    category: 'official',
  },
} as const;

/**
 * Obtient la liste des rapports officiels disponibles
 */
export function getDefaultReports(): DefaultReport[] {
  return Object.values(DEFAULT_REPORTS);
}

/**
 * Vérifie si un ID de rapport est un rapport officiel par défaut
 */
export function isDefaultReport(reportId: string): reportId is ReportType {
  return reportId in DEFAULT_REPORTS;
}

/**
 * Obtient un rapport par défaut par son ID
 */
export function getDefaultReportById(reportId: ReportType): DefaultReport | undefined {
  return DEFAULT_REPORTS[reportId];
}

/**
 * Obtient les formats d'export disponibles pour un rapport
 */
export function getAvailableExportFormats(reportId: ReportType): ('pdf' | 'excel' | 'word')[] {
  const report = DEFAULT_REPORTS[reportId];
  return report ? report.exportFormats : [];
}

/**
 * Configuration globale de l'export
 * Définit que SEULS les rapports par défaut peuvent être exportés
 */
export const EXPORT_CONFIG = {
  /**
   * Si true, seuls les rapports officiels peuvent être exportés
   * Recommandé: true pour conformité aux standards DGDA
   */
  restrictToDefaultReports: true,
  
  /**
   * Message affiché quand un utilisateur tente d'exporter un rapport non-officiel
   */
  restrictionMessage: 'Seuls les rapports officiels DGDA (Feuille de Caisse, Sommaire, Programmation) peuvent être exportés.',
  
  /**
   * Formats d'export autorisés globalement
   */
  allowedFormats: ['pdf', 'excel', 'word'] as const,
  
  /**
   * Le rapport par défaut sélectionné lors de l'export
   */
  defaultSelectedReport: 'feuille-caisse' as ReportType,
} as const;
