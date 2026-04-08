import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { writeAoAToFile } from "@/lib/safeXlsx";
import dgdaLogo from "@/assets/dgda-logo-new.jpg";
import logoEntete from "@/assets/logo-entete-rapport.png";
import logoPiedPage from "@/assets/logo-pied-page-rapport.png";
import { formatMontant } from "@/lib/utils";

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  type?: 'text' | 'currency' | 'number' | 'date';
}

export interface PDFExportSettings {
  useDefaultLogo: boolean;
  customLogoUrl?: string;
  showLogo: boolean;
  headerColor: string;
  headerTextColor: string;
  alternateRowColor: string;
  borderColor: string;
  orientation: 'portrait' | 'landscape';
  fontSize: number;
  margins: 'normal' | 'narrow' | 'wide';
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
  // Table positioning
  tablePosition?: 'gauche' | 'centre' | 'droite';
  contentAlignment?: 'gauche' | 'centre' | 'droite';
  tableSpacing?: number;
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
  showWatermark: true,
  showFooter: true,
  showGenerationDate: true,
  // Default header - format officiel DGDA
  customHeaderLine1: 'République Démocratique du Congo',
  customHeaderLine2: 'Ministère des Finances',
  customHeaderLine3: 'Direction Générale des Douanes et Accises',
  customHeaderLine4: 'Direction Provinciale de Kin Ville',
  useCustomHeader: false,
  // Default footer - format Crystal Reports
  customFooterLine1: 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
  customFooterLine2: 'B.P 8248 KIN I /Tél.: +243(0) 818 968 481 - +243 (0) 821 920 215 N.I.F.: A0700230J',
  customFooterLine3: 'Email : info@douane.gouv.cd ; contact@douane.gouv.cd ; Web : https://www.douanes.gouv.cd',
  customFooterLine4: '',
  useCustomFooter: false,
  // Table positioning
  tablePosition: 'gauche',
  contentAlignment: 'gauche',
  tableSpacing: 10,
};

export interface ExportOptions {
  title: string;
  filename: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  subtitle?: string;
  pdfSettings?: PDFExportSettings;
  headerLines?: string[];
  footerLines?: string[];
}

// Format currency for display - uses centralized formatMontant
const formatCurrency = (amount: number): string => {
  return formatMontant(amount, { showCurrency: true });
};

// Format number for display with French locale (space as thousand separator)
const formatNumber = (value: number): string => {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

// Format date for display
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR');
};

// Get cell value with formatting based on column type
const getCellValue = (item: Record<string, any>, key: string, columnType?: 'text' | 'currency' | 'number' | 'date'): string => {
  const value = item[key];
  if (value === null || value === undefined) return '';
  
  // Use explicit column type if provided
  if (columnType) {
    switch (columnType) {
      case 'currency':
        return formatCurrency(Number(value));
      case 'number':
        return formatNumber(Number(value));
      case 'date':
        return formatDate(String(value));
      default:
        return String(value);
    }
  }
  
  // Fallback: Auto-detect based on key name
  if (key === 'date' || key === 'created_at') {
    return formatDate(value);
  }
  
  if (key === 'montant' || key === 'montant_prevu' || key === 'solde_initial' || 
      key === 'total_recettes' || key === 'total_depenses' || key === 'solde_final' ||
      key === 'totalRecettes' || key === 'totalDepenses' || key === 'solde' ||
      key === 'recettes' || key === 'depenses') {
    return formatCurrency(Number(value));
  }
  
  return String(value);
};

// Get raw numeric value for Excel (preserves number type for proper formatting)
const getRawCellValue = (item: Record<string, any>, key: string, columnType?: 'text' | 'currency' | 'number' | 'date'): string | number => {
  const value = item[key];
  if (value === null || value === undefined) return '';
  
  // For currency and number types, return raw number for Excel
  if (columnType === 'currency' || columnType === 'number') {
    return Number(value);
  }
  
  // Auto-detect currency fields
  if (key === 'montant' || key === 'montant_prevu' || key === 'solde_initial' || 
      key === 'total_recettes' || key === 'total_depenses' || key === 'solde_final' ||
      key === 'totalRecettes' || key === 'totalDepenses' || key === 'solde' ||
      key === 'recettes' || key === 'depenses') {
    return Number(value);
  }
  
  if (columnType === 'date' || key === 'date' || key === 'created_at') {
    return formatDate(String(value));
  }
  
  return String(value);
};

// Default footer text for DGDA — format Crystal Reports
const DEFAULT_FOOTER_SLOGAN = 'Tous mobilisés pour une douane d\'action et d\'excellence !';
const DEFAULT_FOOTER_LINE1 = 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe';
const DEFAULT_FOOTER_LINE2 = 'B.P 8248 KIN I /Tél.: +243(0) 818 968 481 - +243 (0) 821 920 215 N.I.F.: A0700230J';
const DEFAULT_FOOTER_LINE3 = 'Email : info@douane.gouv.cd ; contact@douane.gouv.cd ; Web : https://www.douanes.gouv.cd';
const DEFAULT_FOOTER_LINE4 = '';

// Default header text
const DEFAULT_HEADER_LINE1 = 'République Démocratique du Congo';
const DEFAULT_HEADER_LINE2 = 'Ministère des Finances';
const DEFAULT_HEADER_LINE3 = 'Direction Générale des Douanes et Accises';
const DEFAULT_HEADER_LINE4 = 'Direction Provinciale de Kin Ville';

// Add watermark to PDF page — logo DGDA centré, semi-transparent
const addPDFWatermark = (doc: jsPDF, show: boolean = true) => {
  if (!show) return;
  try {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const wmSize = 120;
    const wmX = (pageWidth - wmSize) / 2;
    const wmY = (pageHeight - wmSize) / 2;
    // Dessiner le logo avec opacité réduite pour effet filigrane
    doc.saveGraphicsState();
    (doc as any).setGState(new (doc as any).GState({ opacity: 0.08 }));
    doc.addImage(dgdaLogo, 'JPEG', wmX, wmY, wmSize, wmSize);
    doc.restoreGraphicsState();
  } catch {
    // Silencieux si l'image n'est pas disponible
  }
};

// Add custom footer to PDF page — image PNG officielle Crystal Reports
const addPDFFooter = (doc: jsPDF, pageNumber: number, totalPages: number, settings: PDFExportSettings) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  if (settings.showFooter) {
    try {
      // Image pied de page officielle : pleine largeur, en bas
      // Dimensions proportionnelles : image source ~940x70px → hauteur ≈20mm
      const imgH = 18;
      const imgY = pageHeight - imgH - 5;
      doc.addImage(logoPiedPage, 'PNG', 5, imgY, pageWidth - 10, imgH);
    } catch {
      // Fallback textuel si l'image échoue
      const footerStartY = pageHeight - 28;
      doc.setFontSize(8);
      doc.setFont('times', 'bolditalic');
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(5, footerStartY - 2, pageWidth - 5, footerStartY - 2);
      doc.text(DEFAULT_FOOTER_SLOGAN, pageWidth / 2, footerStartY + 2, { align: 'center' });
      doc.setFontSize(6.5);
      doc.setFont('times', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(DEFAULT_FOOTER_LINE1, pageWidth / 2, footerStartY + 6, { align: 'center' });
      doc.text(DEFAULT_FOOTER_LINE2, pageWidth / 2, footerStartY + 9.5, { align: 'center' });
      doc.text(DEFAULT_FOOTER_LINE3, pageWidth / 2, footerStartY + 13, { align: 'center' });
    }
  }
  
  // "Imprimé le" à gauche et "Page N / M" à droite — sous l'image
  const bottomY = pageHeight - 4;
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  doc.setTextColor(0, 0, 0);
  
  if (settings.showGenerationDate) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Imprimé le : ${dateStr} ; ${timeStr}`, 5, bottomY);
  }
  
  doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth - 5, bottomY, { align: 'right' });
};

// Helper to convert hex to RGB
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [59, 130, 246]; // Default blue
};

// Add DGDA header with logo - Format officiel Crystal Reports (image PNG officielle)
const addPDFHeader = async (doc: jsPDF, settings: PDFExportSettings): Promise<number> => {
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 8;

  // 1. Image en-tête officielle : pleine largeur
  try {
    // Image source ~940x70px → hauteur ~18mm
    const imgH = 18;
    doc.addImage(logoEntete, 'PNG', 5, yPos, pageWidth - 10, imgH);
    yPos += imgH + 4;
  } catch {
    // Fallback textuel si l'image échoue
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('République Démocratique du Congo', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text('Ministère des Finances', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text('Direction Générale des Douanes et Accises', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.setFont('times', 'bold');
    doc.text('D.G.D.A', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.setFont('times', 'italic');
    doc.text('Direction Provinciale de Kin Ville', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }

  // 2. BUREAU COMPTABLE souligné — aligné à gauche (format Crystal Reports)
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const bcText = 'BUREAU  COMPTABLE';
  const bcWidth = doc.getTextWidth(bcText);
  doc.text(bcText, 5, yPos);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(5, yPos + 1, 5 + bcWidth, yPos + 1);
  yPos += 8;

  return yPos;
};

// Get margin values based on setting
const getMargins = (marginSetting: 'normal' | 'narrow' | 'wide'): { top: number; right: number; bottom: number; left: number } => {
  switch (marginSetting) {
    case 'narrow':
      return { top: 10, right: 10, bottom: 30, left: 10 };
    case 'wide':
      return { top: 20, right: 25, bottom: 45, left: 25 };
    default:
      return { top: 14, right: 14, bottom: 40, left: 14 };
  }
};

export const exportToPDF = async ({ title, filename, columns, data, subtitle, pdfSettings }: ExportOptions): Promise<void> => {
  const settings = pdfSettings || defaultPDFSettings;
  const margins = getMargins(settings.margins);
  
  const doc = new jsPDF({
    orientation: settings.orientation,
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.width;
  
  // Add DGDA header with logo
  const headerEndY = await addPDFHeader(doc, settings);
  
  // Add title - centered, bold, underlined
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.setTextColor(0, 0, 0);
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, pageWidth / 2, headerEndY + 4, { align: 'center' });
  doc.line((pageWidth - titleWidth) / 2, headerEndY + 5, (pageWidth + titleWidth) / 2, headerEndY + 5);
  
  let currentY = headerEndY + 4;
  if (subtitle) {
    currentY += 7;
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text(subtitle, pageWidth / 2, currentY, { align: 'center' });
  }
  
  // Add generation date if enabled
  if (settings.showGenerationDate) {
    currentY += 6;
    doc.setFontSize(9);
    doc.setFont('times', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, currentY, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }
  
  // Prepare table data with proper formatting
  const tableHeaders = columns.map(col => col.header);
  const tableData = data.map(item => 
    columns.map(col => getCellValue(item, col.key, col.type))
  );
  
  // Convert colors
  const headerColorRgb = hexToRgb(settings.headerColor);
  const headerTextColorRgb = hexToRgb(settings.headerTextColor);
  const alternateRowColorRgb = hexToRgb(settings.alternateRowColor);
  const borderColorRgb = hexToRgb(settings.borderColor);
  
  // Add table with pagination support
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: currentY + 6,
    styles: {
      fontSize: settings.fontSize,
      cellPadding: 2,
      lineColor: borderColorRgb,
      lineWidth: 0.2,
      font: 'times',
    },
    headStyles: {
      fillColor: headerColorRgb,
      textColor: headerTextColorRgb,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: alternateRowColorRgb,
    },
    columnStyles: columns.reduce((acc, col, index) => {
      if (col.width) {
        acc[index] = { cellWidth: col.width };
      }
      return acc;
    }, {} as Record<number, { cellWidth: number }>),
    margin: { 
      top: margins.top,
      right: margins.right,
      bottom: settings.showFooter ? margins.bottom : 20,
      left: margins.left,
    },
  });
  
  // Add watermark and footer with pagination to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addPDFWatermark(doc, settings.showWatermark);
    addPDFFooter(doc, i, pageCount, settings);
  }
  
  // Save the PDF
  doc.save(`${filename}.pdf`);
};

/**
 * Export PDF dédié Feuille de Caisse — format Crystal Reports MVTCAISSEF
 * 2 rangées d'en-tête, groupement par date, sous-totaux, TOTAL/ENCAISSE/BALANCE,
 * "Nous disons", date, signature comptable.
 */
export interface FeuilleCaissePDFItem {
  date: string;          // date brute yyyy-mm-dd
  numeroOrdre: number;
  numeroBEO: string;
  libelle: string;
  recette: number;
  depense: number;
  imp?: string;
}

export interface FeuilleCaissePDFOptions {
  data: FeuilleCaissePDFItem[];
  moisLabel: string;
  annee: number;
  dateFeuille: string;
  nomComptable: string;
  soldeInitial: number;
  totalEnLettres: string;
}

export const exportFeuilleCaissePDF = async (options: FeuilleCaissePDFOptions): Promise<void> => {
  const { data, moisLabel, annee, dateFeuille, nomComptable, soldeInitial, totalEnLettres } = options;
  const settings = defaultPDFSettings;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;

  // 1. En-tête officiel DGDA + logo + BUREAU COMPTABLE
  const headerEndY = await addPDFHeader(doc, settings);

  // 2. Titre — centré, gras, remonté de 5mm
  doc.setFontSize(10);
  doc.setFont('courier', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('FEUILLE DE CAISSE MOIS DE', pageWidth / 2, headerEndY - 3, { align: 'center' });
  doc.text(`${moisLabel.toUpperCase()} ${annee}`, pageWidth / 2, headerEndY + 2, { align: 'center' });

  // 3. Construire le body du tableau avec groupement par date
  const grouped = new Map<string, FeuilleCaissePDFItem[]>();
  data.forEach(item => {
    const k = item.date;
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(item);
  });

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const fmtNum = (n: number) => formatMontant(n);

  const bodyRows: any[][] = [];
  const rowStyles: Record<number, { fontStyle?: string; fillColor?: number[]; textColor?: number[] }> = {};
  let rowIdx = 0;

  grouped.forEach((items, dateKey) => {
    const df = fmtDate(dateKey);
    const grpR = items.reduce((s, i) => s + (i.recette || 0), 0);
    const grpD = items.reduce((s, i) => s + (i.depense || 0), 0);

    // Données du groupe
    items.forEach(item => {
      // Nettoyer le libellé : masquer "null"
      const libelleCleaned = (item.libelle || '').replace(/\s*-\s*null$/i, '').replace(/\s*null$/i, '');
      bodyRows.push([
        df,
        String(item.numeroOrdre),
        item.numeroBEO,
        libelleCleaned,
        item.recette ? fmtNum(item.recette) : '',
        item.depense ? fmtNum(item.depense) : '',
        item.imp || '',
      ]);
      rowIdx++;
    });

    // Pied de groupe — ligne vide de séparation
    bodyRows.push(['', '', '', '', '', '', '']);
    rowIdx++;
  });

  // 4. Totaux
  const totalR = data.reduce((s, i) => s + (i.recette || 0), 0);
  const totalD = data.reduce((s, i) => s + (i.depense || 0), 0);
  const solde = totalR - totalD;
  const balance = soldeInitial + solde;

  // TOTAL
  bodyRows.push([{ content: 'TOTAL :', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, fmtNum(totalR), fmtNum(totalD), '']);
  rowStyles[rowIdx] = { fontStyle: 'bold' };
  rowIdx++;

  // ENCAISSE
  bodyRows.push([{ content: 'ENCAISSE :', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, { content: fmtNum(solde), colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }, '']);
  rowStyles[rowIdx] = { fontStyle: 'bold' };
  rowIdx++;

  // BALANCE
  bodyRows.push([{ content: 'BALANCE :', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, { content: fmtNum(balance), colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }, '']);
  rowStyles[rowIdx] = { fontStyle: 'bold' };
  rowIdx++;

  // 5. Dessiner le tableau
  autoTable(doc, {
    head: [
      [
        { content: 'Date', styles: { halign: 'center' } },
        { content: 'N°ORD', styles: { halign: 'center' } },
        { content: 'N°BEO', styles: { halign: 'center' } },
        { content: 'LIBELLE', styles: { halign: 'center' } },
        { content: 'MONTANT', colSpan: 3, styles: { halign: 'center' } },
      ],
      [
        { content: '', colSpan: 4 },
        { content: 'RECETTE', styles: { halign: 'center' } },
        { content: 'DEPENSE', styles: { halign: 'center' } },
        { content: 'IMP', styles: { halign: 'center' } },
      ],
    ],
    body: bodyRows,
    showHead: 'firstPage',
    startY: headerEndY + 8,
    styles: {
      fontSize: 8,
      font: 'courier',
      cellPadding: 1,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
      overflow: 'ellipsize',
      minCellHeight: 4,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 18, halign: 'center' },
    },
    didParseCell: function(hookData) {
      const r = hookData.row.index;
      if (hookData.section === 'body' && rowStyles[r]) {
        const st = rowStyles[r];
        if (st.fillColor) hookData.cell.styles.fillColor = st.fillColor as any;
        if (st.fontStyle) hookData.cell.styles.fontStyle = st.fontStyle as any;
      }
    },
    margin: { top: 14, right: 2, bottom: 40, left: 2 },
  });

  // 6. Après le tableau : "Nous disons", date, signature
  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  const pageHeight = doc.internal.pageSize.height;
  const signatureBlockHeight = 55; // hauteur nécessaire pour tout le bloc signature
  let y = finalY + 6;

  // Vérifier s'il reste assez d'espace pour le bloc signature complet
  // (footerZone ≈ 35mm en bas de page)
  if (y + signatureBlockHeight > pageHeight - 35) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  const labelND = 'Nous disons :  ';
  const labelWidth = doc.getTextWidth(labelND);
  const contentWidth = pageWidth - 28 - labelWidth; // largeur dispo pour le montant
  const montantLines = doc.splitTextToSize(totalEnLettres, contentWidth);
  // Première ligne : label + début du montant
  doc.text(labelND + montantLines[0], 14, y);
  // Lignes suivantes : indentées sous le montant
  for (let li = 1; li < montantLines.length; li++) {
    y += 5;
    doc.text(montantLines[li], 14 + labelWidth, y);
  }
  y += 8;

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.text(`Fait à Kinshasa, le ${dateFeuille}`, pageWidth / 2, y, { align: 'center' });
  y += 12;

  doc.setFont('courier', 'bold');
  doc.text('COMPTABLE PROVINCIALE DES DEPENSES', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.text(nomComptable, pageWidth / 2, y, { align: 'center' });

  // 7. Footer sur toutes les pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addPDFFooter(doc, i, pageCount, settings);
  }

  doc.save(`feuille_caisse_${moisLabel.toLowerCase()}_${annee}.pdf`);
};

/**
 * Export PDF dédié Sommaire DGDA — format Crystal Reports SOMMAIRE
 * Tableau IMP | DESIGNATION | RECETTES | DEPENSES
 * Solde antérieur, recettes par libellé, dépenses par code IMP
 * TOTAL / ENCAISSE / BALANCE, "Nous disons", date, signature
 */
export interface SommairePDFRow {
  type: 'recette' | 'depense';
  imp: string;
  designation: string;
  recette: number;
  depense: number;
}

export interface SommairePDFOptions {
  rows: SommairePDFRow[];
  soldePrecedent: number;
  moisLabel: string;
  annee: number;
  dateFeuille: string;
  nomComptable: string;
  encaisseEnLettres: string;
}

export const exportSommairePDF = async (options: SommairePDFOptions): Promise<void> => {
  const { rows, soldePrecedent, moisLabel, annee, dateFeuille, nomComptable, encaisseEnLettres } = options;
  const settings = defaultPDFSettings;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;

  // 1. En-tête officiel DGDA
  const headerEndY = await addPDFHeader(doc, settings);

  // 2. Titre aligné à droite + Direction à gauche (format Crystal Reports)
  doc.setFontSize(12);
  doc.setFont('courier', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`SOMMAIRE DU MOIS DE`, pageWidth - 5, headerEndY - 3, { align: 'right' });
  doc.text(`${moisLabel.toUpperCase()} ${annee}`, pageWidth - 5, headerEndY + 4, { align: 'right' });

  // Direction Provinciale — à gauche, italique cursive
  doc.setFontSize(11);
  doc.setFont('times', 'bolditalic');
  doc.text('Direction Provinciale', 5, headerEndY + 3);
  doc.text('   Kinshasa-Ville', 5, headerEndY + 8);

  // Référence DGDA — à gauche, courier bold
  doc.setFontSize(10);
  doc.setFont('courier', 'bold');
  doc.text(`DGDA/3400/DP/KV/SDAF/          /${annee}`, 5, headerEndY + 16);

  const fmtNum = (n: number) => formatMontant(n);

  // 3. Construire le body du tableau
  const bodyRows: any[][] = [];

  // Solde antérieur
  bodyRows.push([
    { content: '707820', styles: { halign: 'center', fontStyle: 'bold' } },
    { content: 'Solde du mois antérieur', styles: { fontStyle: 'bold' } },
    { content: fmtNum(soldePrecedent), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '', styles: { halign: 'right' } },
  ]);

  // Recettes
  for (const row of rows.filter(r => r.type === 'recette')) {
    bodyRows.push([
      { content: row.imp, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: row.designation, styles: { fontStyle: 'bold' } },
      { content: fmtNum(row.recette), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: '', styles: { halign: 'right' } },
    ]);
  }

  // Dépenses
  for (const row of rows.filter(r => r.type === 'depense')) {
    bodyRows.push([
      { content: row.imp, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: row.designation, styles: { fontStyle: 'bold' } },
      { content: '', styles: { halign: 'right' } },
      { content: fmtNum(row.depense), styles: { halign: 'right', fontStyle: 'bold' } },
    ]);
  }

  // Calculs des totaux
  const totalRecettesLignes = rows.filter(r => r.type === 'recette').reduce((s, r) => s + r.recette, 0);
  const totalDepenses = rows.filter(r => r.type === 'depense').reduce((s, r) => s + r.depense, 0);
  const totalRecettes = soldePrecedent + totalRecettesLignes;
  const encaisse = totalRecettes - totalDepenses;

  // TOTAL
  bodyRows.push([
    { content: 'TOTAL :', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: fmtNum(totalRecettes), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: fmtNum(totalDepenses), styles: { halign: 'right', fontStyle: 'bold' } },
  ]);
  // ENCAISSE
  bodyRows.push([
    { content: 'ENCAISSE :', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: fmtNum(encaisse), colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
  ]);
  // BALANCE
  bodyRows.push([
    { content: 'BALANCE :', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: fmtNum(totalRecettes), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: fmtNum(totalRecettes), styles: { halign: 'right', fontStyle: 'bold' } },
  ]);

  // 4. Tableau
  autoTable(doc, {
    head: [
      [
        { content: 'IMP.', styles: { halign: 'center' } },
        { content: 'DESIGNATION', styles: { halign: 'center' } },
        { content: 'MONTANTS', colSpan: 2, styles: { halign: 'center' } },
      ],
      [
        { content: '', colSpan: 2 },
        { content: 'RECETTES', styles: { halign: 'center' } },
      ],
    ],
    body: bodyRows,
    showHead: 'firstPage',
    startY: headerEndY + 21,
    styles: {
      fontSize: 8,
      font: 'courier',
      cellPadding: 1.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
      overflow: 'ellipsize',
      minCellHeight: 4,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 108, overflow: 'ellipsize' },
      2: { cellWidth: 38, halign: 'right' },
      3: { cellWidth: 38, halign: 'right' },
    },
    margin: { top: 14, right: 5, bottom: 30, left: 5 },
  });

  // 5. Bloc signature
  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  const pageHeight = doc.internal.pageSize.height;
  let y = finalY + 6;

  if (y + 55 > pageHeight - 35) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  const labelND = 'Nous disons :  ';
  const labelWidth = doc.getTextWidth(labelND);
  const contentWidth = pageWidth - 10 - labelWidth;
  const montantLines = doc.splitTextToSize(encaisseEnLettres, contentWidth);
  doc.text(labelND + montantLines[0], 5, y);
  for (let li = 1; li < montantLines.length; li++) {
    y += 5;
    doc.text(montantLines[li], 5 + labelWidth, y);
  }
  y += 8;

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.text(`Fait à Kinshasa, le ${dateFeuille}`, pageWidth / 2, y, { align: 'center' });
  y += 12;

  doc.setFont('courier', 'bold');
  doc.text('COMPTABLE PROVINCIALE DES DEPENSES', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.text(nomComptable || '____________________', pageWidth / 2, y, { align: 'center' });

  // 6. Footer sur toutes les pages
  const pageCount2 = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount2; i++) {
    doc.setPage(i);
    addPDFFooter(doc, i, pageCount2, settings);
  }

  doc.save(`sommaire_${moisLabel.toLowerCase()}_${annee}.pdf`);
};

// ===================== PROGRAMMATION PDF =====================

export interface ProgrammationPDFRow {
  libelle: string;
  montant: number;
}

export interface ProgrammationPDFOptions {
  rows: ProgrammationPDFRow[];
  moisLabel: string;
  annee: string;
  dateProgrammation: string;
  nomDAF: string;
  nomDP: string;
  montantEnLettres: string;
}

export const exportProgrammationPDF = async (options: ProgrammationPDFOptions): Promise<void> => {
  const { rows, moisLabel, annee, dateProgrammation, nomDAF, nomDP, montantEnLettres } = options;
  const settings = defaultPDFSettings;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;

  // 1. En-tête officiel DGDA
  const headerEndY = await addPDFHeader(doc, settings);

  // 2. Titre centré
  doc.setFontSize(11);
  doc.setFont('courier', 'bold');
  // 2. Titre aligné à droite + Direction à gauche (format Crystal Reports)
  doc.setFontSize(12);
  doc.setFont('courier', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('PROGRAMATION DES', pageWidth - 5, headerEndY - 3, { align: 'right' });
  doc.text(`DEPENSES MOIS DE`, pageWidth - 5, headerEndY + 4, { align: 'right' });
  doc.text(`${moisLabel.toUpperCase()} ${annee}`, pageWidth - 5, headerEndY + 11, { align: 'right' });

  // Direction Provinciale — à gauche, italique cursive
  doc.setFontSize(11);
  doc.setFont('times', 'bolditalic');
  doc.text('Direction Provinciale', 5, headerEndY + 3);
  doc.text('   Kinshasa-Ville', 5, headerEndY + 8);

  // Référence DGDA — à gauche, courier bold
  doc.setFontSize(10);
  doc.setFont('courier', 'bold');
  doc.text(`DGDA/3400/DP/KV/SDAF/          /${annee}`, 5, headerEndY + 16);

  const fmtNum = (n: number) => formatMontant(n);

  // 3. Body du tableau
  const bodyRows: any[][] = rows.map((row, i) => [
    { content: String(i + 1), styles: { halign: 'center', fontStyle: 'bold' } },
    { content: row.libelle, styles: { fontStyle: 'bold' } },
    { content: fmtNum(row.montant), styles: { halign: 'right', fontStyle: 'bold' } },
  ]);

  // Total
  const total = rows.reduce((s, r) => s + r.montant, 0);
  bodyRows.push([
    { content: 'MONTANTS TOTAL', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: fmtNum(total), styles: { halign: 'right', fontStyle: 'bold' } },
  ]);

  // 4. Tableau
  autoTable(doc, {
    head: [
      [
        { content: 'N°.', styles: { halign: 'center' } },
        { content: 'LIBELLE', styles: { halign: 'center' } },
        { content: 'MONTANTS', styles: { halign: 'center' } },
      ],
    ],
    body: bodyRows,
    showHead: 'firstPage',
    startY: headerEndY + 21,
    styles: {
      fontSize: 8,
      font: 'courier',
      cellPadding: 1.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
      overflow: 'ellipsize',
      minCellHeight: 4,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto', overflow: 'ellipsize' },
      2: { cellWidth: 38, halign: 'right' },
    },
    margin: { top: 14, right: 5, bottom: 30, left: 5 },
  });

  // 5. Bloc signature
  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  const pageHeight = doc.internal.pageSize.height;
  let y = finalY + 6;

  if (y + 60 > pageHeight - 35) {
    doc.addPage();
    y = 20;
  }

  // Nous disons
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  const labelND = 'Nous disons :  ';
  const labelWidth = doc.getTextWidth(labelND);
  const contentWidth = pageWidth - 10 - labelWidth;
  const montantLines = doc.splitTextToSize(montantEnLettres, contentWidth);
  doc.text(labelND + montantLines[0], 5, y);
  for (let li = 1; li < montantLines.length; li++) {
    y += 5;
    doc.text(montantLines[li], 5 + labelWidth, y);
  }
  y += 8;

  // Date et lieu
  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.text(`Fait à Kinshasa, le ${dateProgrammation}`, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Double signature — deux colonnes centrées
  const leftCenterX = pageWidth / 4;
  const rightCenterX = (pageWidth / 4) * 3;
  const colW = (pageWidth / 2) - 10;

  // Titres des signataires
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  const leftTitle = "LE SOUS-DIRECTEUR CHARGE DE\nL'ADMINISTRATION ET DES FINANCES";
  const rightTitle = "LE DIRECTEUR CHARGER PROVINCIAL";
  const leftTitleLines = doc.splitTextToSize(leftTitle, colW);
  const rightTitleLines = doc.splitTextToSize(rightTitle, colW);
  leftTitleLines.forEach((line: string, i: number) => {
    doc.text(line, leftCenterX, y + i * 4, { align: 'center' });
  });
  rightTitleLines.forEach((line: string, i: number) => {
    doc.text(line, rightCenterX, y + i * 4, { align: 'center' });
  });

  // Noms des signataires
  const maxTitleLines = Math.max(leftTitleLines.length, rightTitleLines.length);
  y += maxTitleLines * 4 + 15;
  doc.setFontSize(10);
  doc.text(nomDAF || '____________________', leftCenterX, y, { align: 'center' });
  doc.text(nomDP || '____________________', rightCenterX, y, { align: 'center' });

  // 6. Footer sur toutes les pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addPDFFooter(doc, i, pageCount, settings);
  }

  doc.save(`programmation_${moisLabel.toLowerCase()}_${annee}.pdf`);
};

export const exportToExcel = ({ title, filename, columns, data, subtitle, pdfSettings, headerLines, footerLines }: ExportOptions): void => {
  const settings = pdfSettings || defaultPDFSettings;
  
  // Get header/footer lines - use custom arrays if provided, otherwise settings or defaults
  const headerLine1 = headerLines?.[0] || (settings.useCustomHeader ? settings.customHeaderLine1 : DEFAULT_HEADER_LINE1);
  const headerLine2 = headerLines?.[1] || (settings.useCustomHeader ? settings.customHeaderLine2 : DEFAULT_HEADER_LINE2);
  const headerLine3 = headerLines?.[2] || (settings.useCustomHeader ? settings.customHeaderLine3 : DEFAULT_HEADER_LINE3);
  const headerLine4 = headerLines?.[3] || (settings.useCustomHeader ? settings.customHeaderLine4 : DEFAULT_HEADER_LINE4);
  const headerLine5 = headerLines?.[4] || '';
  
  const footerLine1 = footerLines?.[0] || (settings.useCustomFooter ? settings.customFooterLine1 : DEFAULT_FOOTER_LINE1);
  const footerLine2 = footerLines?.[1] || (settings.useCustomFooter ? settings.customFooterLine2 : DEFAULT_FOOTER_LINE2);
  const footerLine3 = footerLines?.[2] || (settings.useCustomFooter ? settings.customFooterLine3 : DEFAULT_FOOTER_LINE3);
  const footerLine4 = footerLines?.[3] || (settings.useCustomFooter ? settings.customFooterLine4 : DEFAULT_FOOTER_LINE4);
  
  // Prepare worksheet data
  const wsData: any[][] = [];
  
  // Add custom header lines
  wsData.push([headerLine1]);
  wsData.push([headerLine2]);
  wsData.push([headerLine3]);
  if (headerLine4) wsData.push([headerLine4]);
  if (headerLine5) wsData.push([headerLine5]);
  wsData.push([]);
  
  // Add title row
  wsData.push([title]);
  
  // Add subtitle if provided
  if (subtitle) {
    wsData.push([subtitle]);
  }
  
  // Add generation date
  wsData.push([`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`]);
  
  // Add empty row
  wsData.push([]);
  
  // Add headers
  wsData.push(columns.map(col => col.header));
  
  // Add data rows with proper number formatting
  data.forEach(item => {
    wsData.push(columns.map(col => getRawCellValue(item, col.key, col.type)));
  });
  
  // Add footer
  wsData.push([]);
  wsData.push(['───────────────────────────────────────────────────────────────────────────────']);
  if (footerLine1) wsData.push([footerLine1]);
  if (footerLine2) wsData.push([footerLine2]);
  if (footerLine3) wsData.push([footerLine3]);
  if (footerLine4) wsData.push([footerLine4]);
  
  // Sanitize data and write Excel file using safe wrapper
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  writeAoAToFile(wsData, `${filename}.xlsx`, 'Données', colWidths);
};

// Recettes export configuration
export const getRecettesExportConfig = (data: any[], dateFilter?: string) => ({
  title: 'Liste des Recettes',
  filename: `recettes_${new Date().toISOString().split('T')[0]}`,
  subtitle: dateFilter ? `Période: ${dateFilter}` : undefined,
  columns: [
    { header: 'N° Bon', key: 'numero_bon', width: 10 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Heure', key: 'heure', width: 10 },
    { header: 'Provenance', key: 'provenance', width: 20 },
    { header: 'Motif', key: 'motif', width: 25 },
    { header: 'Montant', key: 'montant', width: 15 },
    { header: 'Observation', key: 'observation', width: 20 },
  ],
  data,
});

// Dépenses export configuration
export const getDepensesExportConfig = (data: any[], dateFilter?: string) => ({
  title: 'Liste des Dépenses',
  filename: `depenses_${new Date().toISOString().split('T')[0]}`,
  subtitle: dateFilter ? `Période: ${dateFilter}` : undefined,
  columns: [
    { header: 'N° Bon', key: 'numero_bon', width: 10 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Heure', key: 'heure', width: 10 },
    { header: 'Bénéficiaire', key: 'beneficiaire', width: 20 },
    { header: 'Motif', key: 'motif', width: 25 },
    { header: 'Rubrique', key: 'rubrique_libelle', width: 20 },
    { header: 'Montant', key: 'montant', width: 15 },
    { header: 'Observation', key: 'observation', width: 20 },
  ],
  data,
});

// Feuille de caisse export configuration
export const getFeuilleCaisseExportConfig = (
  recettes: any[],
  depenses: any[],
  totals: { soldeInitial: number; totalRecettes: number; totalDepenses: number; soldeFinal: number },
  date: string
) => {
  // Combine recettes and depenses for the report
  const allOperations = [
    ...recettes.map(r => ({ ...r, type: 'Recette', rubrique_libelle: '-' })),
    ...depenses.map(d => ({ ...d, type: 'Dépense', provenance: d.beneficiaire })),
  ].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.heure}`);
    const dateB = new Date(`${b.date}T${b.heure}`);
    return dateA.getTime() - dateB.getTime();
  });
  
  return {
    title: 'Feuille de Caisse',
    filename: `feuille_caisse_${date}`,
    subtitle: `Date: ${new Date(date).toLocaleDateString('fr-FR')} | Solde Initial: ${formatCurrency(totals.soldeInitial)} | Total Recettes: ${formatCurrency(totals.totalRecettes)} | Total Dépenses: ${formatCurrency(totals.totalDepenses)} | Solde Final: ${formatCurrency(totals.soldeFinal)}`,
    columns: [
      { header: 'Type', key: 'type', width: 10 },
      { header: 'N° Bon', key: 'numero_bon', width: 10 },
      { header: 'Heure', key: 'heure', width: 10 },
      { header: 'Provenance/Bénéficiaire', key: 'provenance', width: 20 },
      { header: 'Motif', key: 'motif', width: 25 },
      { header: 'Montant', key: 'montant', width: 15 },
    ],
    data: allOperations,
  };
};

// Programmations export configuration
export const getProgrammationsExportConfig = (data: any[], moisLabel?: string, annee?: number) => ({
  title: 'Liste des Programmations',
  filename: `programmations_${new Date().toISOString().split('T')[0]}`,
  subtitle: moisLabel && annee ? `Période: ${moisLabel} ${annee}` : undefined,
  columns: [
    { header: 'N° Ordre', key: 'numero_ordre', width: 10 },
    { header: 'Désignation', key: 'designation', width: 30 },
    { header: 'Mois', key: 'mois_label', width: 12 },
    { header: 'Année', key: 'annee', width: 10 },
    { header: 'Montant Prévu', key: 'montant_prevu', width: 18 },
    { header: 'Statut', key: 'statut', width: 12 },
  ],
  data: data.map(item => ({
    ...item,
    mois_label: MOIS_LABELS_EXPORT[item.mois - 1] || '',
    statut: item.is_validated ? 'Validé' : 'En attente',
  })),
});

// Rapport mensuel export configuration
const MOIS_LABELS_EXPORT = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const getRapportMensuelExportConfig = (
  monthlyStats: { mois: number; totalRecettes: number; totalDepenses: number; solde: number }[],
  annee: number
) => ({
  title: `Rapport Mensuel ${annee}`,
  filename: `rapport_mensuel_${annee}`,
  subtitle: `Statistiques mensuelles de l'année ${annee}`,
  columns: [
    { header: 'Mois', key: 'mois_label', width: 15 },
    { header: 'Recettes', key: 'recettes', width: 18 },
    { header: 'Dépenses', key: 'depenses', width: 18 },
    { header: 'Solde', key: 'solde', width: 18 },
  ],
  data: monthlyStats.map(stat => ({
    mois_label: MOIS_LABELS_EXPORT[stat.mois - 1],
    recettes: formatCurrency(stat.totalRecettes),
    depenses: formatCurrency(stat.totalDepenses),
    solde: formatCurrency(stat.solde),
  })),
});

// Rapport annuel export configuration
export const getRapportAnnuelExportConfig = (
  annualStats: { annee: number; totalRecettes: number; totalDepenses: number; solde: number }[],
  startYear: number,
  endYear: number
) => ({
  title: `Rapport Annuel ${startYear} - ${endYear}`,
  filename: `rapport_annuel_${startYear}_${endYear}`,
  subtitle: `Comparaison des statistiques sur ${annualStats.length} années`,
  columns: [
    { header: 'Année', key: 'annee', width: 10 },
    { header: 'Recettes', key: 'recettes', width: 18 },
    { header: 'Dépenses', key: 'depenses', width: 18 },
    { header: 'Solde', key: 'solde', width: 18 },
  ],
  data: annualStats.map(stat => ({
    annee: stat.annee.toString(),
    recettes: formatCurrency(stat.totalRecettes),
    depenses: formatCurrency(stat.totalDepenses),
    solde: formatCurrency(stat.solde),
  })),
});
