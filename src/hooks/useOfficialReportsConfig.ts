/**
 * Hook pour gérer la configuration des rapports officiels DGDA
 * Permet d'éditer en-têtes, pieds de page, signatures, etc.
 */

import { useState, useCallback, useEffect } from 'react';

export interface ReportColumn {
  id: string;
  label: string;
  field: string;
  width: number; // en pourcentage
  visible: boolean;
  order: number;
}

export interface OfficialReportConfig {
  // En-tête
  headerLine1: string;
  headerLine2: string;
  headerLine3: string;
  headerLine4: string;
  
  // Logo
  showLogo: boolean;
  logoSize: number; // en pixels
  
  // Référence
  referencePrefix: string;
  
  // Titre
  titleTemplate: string; // ex: "PROGRAMMATION DES DEPENSES MOIS DE {MOIS}/{ANNEE}"
  
  // Signatures
  signatureTitle1: string; // ex: "Sous-directeur"
  signatureName1: string;  // ex: "KABOMBO BADIABIABO"
  signatureTitle2: string; // ex: "Directeur Provincial"
  signatureName2: string;  // ex: "KALALA MASIMANGO"
  
  // Pied de page
  footerLine1: string;
  footerLine2: string;
  footerLine3: string;
  footerLine4: string;
  
  // Format
  pageFormat: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  
  // Style
  titleFont: string;
  titleSize: number;
  bodyFont: string;
  textSize: number;
  headerColor: string;
  accentColor: string;
  alternateRowColor: string;
  borderColor: string;
  
  // Colonnes
  columns: ReportColumn[];
}

export interface OfficialReportsConfigs {
  programmation: OfficialReportConfig;
  feuilleCaisse: OfficialReportConfig;
  sommaire: OfficialReportConfig;
}

// Configuration par défaut DGDA
const DEFAULT_CONFIG: OfficialReportConfig = {
  headerLine1: 'République Démocratique du Congo',
  headerLine2: 'Ministère des Finances',
  headerLine3: 'Direction Générale des Douanes et Accises',
  headerLine4: 'Province du Kongo Central',
  
  showLogo: true,
  logoSize: 120,
  
  referencePrefix: 'DGDA/1400/DP/KV/SDAF/',
  
  titleTemplate: '',
  
  signatureTitle1: 'Sous-directeur',
  signatureName1: 'KABOMBO BADIABIABO',
  signatureTitle2: 'Directeur Provincial',
  signatureName2: 'KALALA MASIMANGO',
  
  footerLine1: 'Direction Générale des Douanes et Accises - Province du Kongo Central',
  footerLine2: 'Tél: +243 81 234 5678 | Email: dgda.kv@finances.gouv.cd',
  footerLine3: 'Site web: www.dgda.finances.gouv.cd',
  footerLine4: 'Adresse: Avenue de la Douane, Matadi, RDC',
  
  pageFormat: 'A4',
  orientation: 'portrait',
  
  // Style par défaut
  titleFont: 'Times New Roman',
  titleSize: 14,
  bodyFont: 'Times New Roman',
  textSize: 10,
  headerColor: '#1e40af',
  accentColor: '#1e40af',
  alternateRowColor: '#f5f7fa',
  borderColor: '#000000',
  
  // Colonnes par défaut (vide, sera défini par rapport)
  columns: [],
};

const DEFAULT_CONFIGS: OfficialReportsConfigs = {
  programmation: {
    ...DEFAULT_CONFIG,
    titleTemplate: 'PROGRAMMATION DES DEPENSES MOIS DE {MOIS}/{ANNEE}',
    columns: [
      { id: 'numero', label: 'N° ORD', field: 'numero_ordre', width: 10, visible: true, order: 0 },
      { id: 'designation', label: 'DÉSIGNATION', field: 'designation', width: 50, visible: true, order: 1 },
      { id: 'montant', label: 'MONTANT PRÉVU', field: 'montant_prevu', width: 20, visible: true, order: 2 },
    ],
  },
  feuilleCaisse: {
    ...DEFAULT_CONFIG,
    titleTemplate: 'FEUILLE DE CAISSE - MOIS DE {MOIS} {ANNEE}',
    headerLine4: 'Direction Provinciale de Kin Ville',
    signatureTitle1: 'Comptable Provincial des Dépenses',
    signatureName1: 'KASANGANGJO - WANDUNA',
    columns: [
      { id: 'date', label: 'Date', field: 'date', width: 10, visible: true, order: 0 },
      { id: 'numero', label: 'N°ord', field: 'numero_ordre', width: 8, visible: true, order: 1 },
      { id: 'beo', label: 'N°BEO', field: 'numero_beo', width: 8, visible: true, order: 2 },
      { id: 'libelle', label: 'LIBELLE', field: 'libelle', width: 40, visible: true, order: 3 },
      { id: 'recette', label: 'RECETTE', field: 'recette', width: 12, visible: true, order: 4 },
      { id: 'depense', label: 'DEPENSE', field: 'depense', width: 12, visible: true, order: 5 },
      { id: 'imp', label: 'IMP', field: 'imp', width: 10, visible: true, order: 6 },
    ],
  },
  sommaire: {
    ...DEFAULT_CONFIG,
    titleTemplate: 'SOMMAIRE DU MOIS DE {MOIS}/{ANNEE}',
    headerLine4: 'Direction Provinciale Kin - Ville',
    referencePrefix: 'DGDA/3400/DP/KV/SDAF/',
    signatureTitle1: 'Comptable Provincial des Dépenses',
    signatureName1: 'KASANGANGJO - WANDUNA',
    signatureTitle2: '',
    signatureName2: '',
    columns: [
      { id: 'article', label: 'ART.', field: 'article', width: 15, visible: true, order: 0 },
      { id: 'designation', label: 'DESIGNATION', field: 'designation', width: 45, visible: true, order: 1 },
      { id: 'recette', label: 'RECETTES', field: 'recette', width: 20, visible: true, order: 2 },
      { id: 'depense', label: 'DEPENSES', field: 'depense', width: 20, visible: true, order: 3 },
    ],
  },
};

const STORAGE_KEY = 'dgda-official-reports-config';

export function useOfficialReportsConfig() {
  const [configs, setConfigs] = useState<OfficialReportsConfigs>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedConfigs = JSON.parse(stored);
        // Fusionner avec les valeurs par défaut pour inclure les nouvelles propriétés
        return {
          programmation: { ...DEFAULT_CONFIGS.programmation, ...parsedConfigs.programmation },
          feuilleCaisse: { ...DEFAULT_CONFIGS.feuilleCaisse, ...parsedConfigs.feuilleCaisse },
          sommaire: { ...DEFAULT_CONFIGS.sommaire, ...parsedConfigs.sommaire },
        };
      }
    } catch (error) {
      console.error('Error loading official reports config:', error);
    }
    return DEFAULT_CONFIGS;
  });

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error('Error saving official reports config:', error);
    }
  }, [configs]);

  // Mettre à jour la configuration d'un rapport spécifique
  const updateConfig = useCallback((
    reportType: keyof OfficialReportsConfigs,
    updates: Partial<OfficialReportConfig>
  ) => {
    setConfigs(prev => ({
      ...prev,
      [reportType]: {
        ...prev[reportType],
        ...updates,
      },
    }));
  }, []);

  // Réinitialiser la configuration d'un rapport
  const resetConfig = useCallback((reportType: keyof OfficialReportsConfigs) => {
    setConfigs(prev => ({
      ...prev,
      [reportType]: DEFAULT_CONFIGS[reportType],
    }));
  }, []);

  // Réinitialiser toutes les configurations
  const resetAllConfigs = useCallback(() => {
    setConfigs(DEFAULT_CONFIGS);
  }, []);

  // Obtenir la configuration d'un rapport
  const getConfig = useCallback(
    (reportType: keyof OfficialReportsConfigs): OfficialReportConfig => {
      return configs[reportType];
    },
    [configs]
  );

  // Exporter la configuration
  const exportConfig = useCallback(() => {
    const dataStr = JSON.stringify(configs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dgda-rapports-config.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [configs]);

  // Importer la configuration
  const importConfig = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString);
      setConfigs(imported);
      return true;
    } catch (error) {
      console.error('Error importing config:', error);
      return false;
    }
  }, []);

  return {
    configs,
    getConfig,
    updateConfig,
    resetConfig,
    resetAllConfigs,
    exportConfig,
    importConfig,
  };
}
