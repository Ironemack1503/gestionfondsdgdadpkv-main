import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileSpreadsheet, FileText, Printer, X, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOfficialReportsConfig } from "@/hooks/useOfficialReportsConfig";
import { toast } from "sonner";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import dgdaLogo from "@/assets/dgda-logo-new.jpg";

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  onExportPDF: () => void;
  onExportExcel: () => void;
}

// Format currency for display
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'CDF',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format date for display
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR');
};

// Get cell value with formatting
const getCellValue = (item: Record<string, any>, key: string): string => {
  const value = item[key];
  if (value === null || value === undefined) return '';
  
  if (key === 'date' || key === 'date_transaction' || key === 'created_at') {
    return formatDate(value);
  }
  
  if (key === 'montant' || key === 'montant_prevu' || key === 'solde_initial' || 
      key === 'total_recettes' || key === 'total_depenses' || key === 'solde_final') {
    return formatCurrency(Number(value));
  }
  
  return String(value);
};

export function ExportPreviewDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  columns,
  data,
  onExportPDF,
  onExportExcel,
}: ExportPreviewDialogProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "pdf" | "excel">("pdf");
  const { configs } = useOfficialReportsConfig();
  // Utiliser la config feuilleCaisse comme base pour les exports génériques
  const config = configs.feuilleCaisse;

  const handleExportPDF = () => {
    onExportPDF();
    onOpenChange(false);
  };

  const handleExportExcel = () => {
    onExportExcel();
    onOpenChange(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // Générer un aperçu PDF avec le nouveau format officiel
  const handlePreviewPDF = async () => {
    try {
      toast.info("Génération de l'aperçu PDF...");
      
      const orientation = config.orientation || 'portrait';
      
      const doc = new jsPDF({
        orientation: orientation as 'portrait' | 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.width;
      let yPos = 15;

      // En-tête officiel centré (italic)
      doc.setFont('times', 'italic');
      doc.setFontSize(11);
      doc.text(config.headerLine1, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.text(config.headerLine2, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.text(config.headerLine3, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      
      // D.G.D.A en gras
      doc.setFont('times', 'bold');
      doc.text('D.G.D.A', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      
      if (config.headerLine4) {
        doc.setFont('times', 'italic');
        doc.text(config.headerLine4, pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
      }

      // Logo centré
      if (config.showLogo) {
        try {
          const logoImg = new Image();
          logoImg.src = dgdaLogo;
          const logoSize = 20;
          doc.addImage(dgdaLogo, 'JPEG', (pageWidth - logoSize) / 2, yPos, logoSize, logoSize);
          yPos += logoSize + 5;
        } catch {
          yPos += 5;
        }
      }

      // BUREAU COMPTABLE souligné
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      const bcText = 'BUREAU COMPTABLE';
      const bcWidth = doc.getTextWidth(bcText);
      doc.text(bcText, pageWidth / 2, yPos, { align: 'center' });
      doc.line((pageWidth - bcWidth) / 2, yPos + 1, (pageWidth + bcWidth) / 2, yPos + 1);
      yPos += 10;

      // Titre du rapport souligné
      doc.setFont('times', 'bold');
      doc.setFontSize(config.titleSize || 14);
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, pageWidth / 2, yPos, { align: 'center' });
      doc.line((pageWidth - titleWidth) / 2, yPos + 1, (pageWidth + titleWidth) / 2, yPos + 1);
      yPos += 8;

      if (subtitle) {
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.text(subtitle, pageWidth / 2, yPos, { align: 'center' });
        yPos += 6;
      }

      // Tableau de données
      const tableHeaders = columns.map(col => col.header);
      const tableData = data.map(item =>
        columns.map(col => getCellValue(item, col.key))
      );

      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: yPos,
        theme: 'grid',
        styles: {
          font: 'times',
          fontSize: config.textSize || 9,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        margin: { left: 15, right: 15 },
      });

      // Date et lieu
      const finalY = (doc as any).lastAutoTable?.finalY || yPos + 50;
      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      const now = new Date();
      const dateStr = `Fait à Kinshasa, le ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
      doc.text(dateStr, pageWidth - 20, finalY + 10, { align: 'right' });

      // Signatures
      const sigY = finalY + 25;
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      if (config.signatureTitle1) {
        doc.text(config.signatureTitle1.toUpperCase(), pageWidth / 4, sigY, { align: 'center' });
        if (config.signatureName1) {
          doc.setFont('times', 'bold');
          const name1 = config.signatureName1;
          const name1Width = doc.getTextWidth(name1);
          doc.text(name1, pageWidth / 4, sigY + 20, { align: 'center' });
          doc.line(pageWidth / 4 - name1Width / 2, sigY + 21, pageWidth / 4 + name1Width / 2, sigY + 21);
        }
      }
      if (config.signatureTitle2) {
        doc.setFont('times', 'bold');
        doc.text(config.signatureTitle2.toUpperCase(), (3 * pageWidth) / 4, sigY, { align: 'center' });
        if (config.signatureName2) {
          const name2 = config.signatureName2;
          const name2Width = doc.getTextWidth(name2);
          doc.text(name2, (3 * pageWidth) / 4, sigY + 20, { align: 'center' });
          doc.line((3 * pageWidth) / 4 - name2Width / 2, sigY + 21, (3 * pageWidth) / 4 + name2Width / 2, sigY + 21);
        }
      }

      // Pied de page
      const pageHeight = doc.internal.pageSize.height;
      doc.setDrawColor(150, 150, 150);
      doc.line(15, pageHeight - 18, pageWidth - 15, pageHeight - 18);
      doc.setFont('times', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      if (config.footerLine1) doc.text(config.footerLine1, pageWidth / 2, pageHeight - 14, { align: 'center' });
      if (config.footerLine2) doc.text(config.footerLine2, pageWidth / 2, pageHeight - 11, { align: 'center' });
      if (config.footerLine3) doc.text(config.footerLine3, pageWidth / 2, pageHeight - 8, { align: 'center' });
      if (config.footerLine4) doc.text(config.footerLine4, pageWidth / 2, pageHeight - 5, { align: 'center' });

      // Ouvrir l'aperçu
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      
      toast.success("Aperçu PDF généré !");
    } catch (error) {
      console.error('Erreur PDF:', error);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Aperçu du rapport — {title}
          </DialogTitle>
          <DialogDescription>
            Prévisualisation du rapport au format officiel DGDA
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pdf">Aperçu PDF</TabsTrigger>
            <TabsTrigger value="excel">Aperçu Excel</TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[500px] rounded-md border bg-gray-200">
              <div className="p-6 flex justify-center">
                {/* Simulation de la page PDF format officiel */}
                <div 
                  className="bg-white shadow-2xl w-full max-w-xl relative overflow-hidden"
                  style={{ fontFamily: config.bodyFont || 'Times New Roman', minHeight: '700px' }}
                >
                  {/* En-tête officiel */}
                  <div className="p-6 pb-0 relative z-10">
                    <div className="text-center mb-2">
                      <div className="text-[10px] leading-[1.6] italic">
                        <p>{config.headerLine1}</p>
                        <p>{config.headerLine2}</p>
                        <p>{config.headerLine3}</p>
                        <p className="font-bold not-italic">D.G.D.A</p>
                        {config.headerLine4 && <p>{config.headerLine4}</p>}
                      </div>
                    </div>

                    {/* Logo centré */}
                    {config.showLogo && (
                      <div className="flex justify-center my-3">
                        <img src={dgdaLogo} alt="Logo DGDA" className="w-14 h-14 object-contain" />
                      </div>
                    )}

                    {/* BUREAU COMPTABLE */}
                    <div className="text-center mb-4">
                      <span className="text-[10px] font-bold underline">BUREAU COMPTABLE</span>
                    </div>

                    {/* Titre du rapport */}
                    <h2 
                      className="text-center font-bold underline mb-1" 
                      style={{ fontSize: `${(config.titleSize || 14) - 2}px`, color: config.headerColor }}
                    >
                      {title}
                    </h2>
                    {subtitle && <p className="text-xs text-gray-600 text-center mb-3">{subtitle}</p>}

                    {/* Tableau de données */}
                    <div className="border rounded text-xs mb-4 overflow-hidden" style={{ fontSize: `${config.textSize || 9}px` }}>
                      <table className="w-full">
                        <thead>
                          <tr style={{ backgroundColor: config.headerColor || '#1e40af', color: '#ffffff' }}>
                            {columns.map((col, idx) => (
                              <th key={idx} className="px-2 py-1.5 text-left font-semibold">{col.header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.slice(0, 8).map((item, rowIdx) => (
                            <tr key={rowIdx} style={rowIdx % 2 !== 0 ? { backgroundColor: config.alternateRowColor || '#f5f7fa' } : {}}>
                              {columns.map((col, colIdx) => (
                                <td key={colIdx} className="px-2 py-1 border-t border-gray-200">
                                  {getCellValue(item, col.key)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {data.length > 8 && (
                        <div className="p-2 text-center text-gray-500 border-t bg-gray-50">
                          ... {data.length - 8} autres lignes
                        </div>
                      )}
                    </div>

                    {/* Date et lieu */}
                    <div className="text-right text-[9px] italic mb-4">
                      Fait à Kinshasa, le {new Date().toLocaleDateString('fr-FR')}
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-8 mb-4">
                      {config.signatureTitle1 && (
                        <div className="text-center">
                          <p className="font-bold text-[9px] tracking-wide">{config.signatureTitle1.toUpperCase()}</p>
                          {config.signatureName1 && (
                            <div className="mt-10">
                              <p className="font-bold underline text-[8px]">{config.signatureName1}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {config.signatureTitle2 && (
                        <div className="text-center">
                          <p className="font-bold text-[9px] tracking-wide">{config.signatureTitle2.toUpperCase()}</p>
                          {config.signatureName2 && (
                            <div className="mt-10">
                              <p className="font-bold underline text-[8px]">{config.signatureName2}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pied de page officiel */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-400 text-center text-[7px] italic text-gray-500 z-10">
                    {config.footerLine1 && <p className="mb-0.5">{config.footerLine1}</p>}
                    {config.footerLine2 && <p className="mb-0.5">{config.footerLine2}</p>}
                    {config.footerLine3 && <p className="mb-0.5">{config.footerLine3}</p>}
                    {config.footerLine4 && <p>{config.footerLine4}</p>}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="excel" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[500px] rounded-md border bg-white">
              <div className="p-4">
                <div className="border rounded-lg overflow-hidden font-mono text-xs" style={{ fontFamily: config.bodyFont || 'Times New Roman' }}>
                  {/* Excel header */}
                  <div className="p-3 border-b text-center bg-blue-50">
                    <div className="italic text-gray-600 text-xs">{config.headerLine1}</div>
                    <div className="italic text-gray-600 text-xs">{config.headerLine3}</div>
                    <div className="font-bold">D.G.D.A</div>
                    {config.headerLine4 && <div className="italic text-xs">{config.headerLine4}</div>}
                  </div>
                  
                  <div className="p-2 bg-gray-50 border-b">
                    <div className="font-bold text-center">{title}</div>
                    {subtitle && <div className="text-gray-600 text-center">{subtitle}</div>}
                  </div>

                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: config.headerColor || '#1e40af', color: '#ffffff' }}>
                        <th className="border px-2 py-1 text-left">#</th>
                        {columns.map((col, idx) => (
                          <th key={idx} className="border px-2 py-1 text-left">{col.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.slice(0, 5).map((item, rowIdx) => (
                        <tr key={rowIdx} style={rowIdx % 2 !== 0 ? { backgroundColor: config.alternateRowColor || '#f5f7fa' } : {}}>
                          <td className="border px-2 py-1 text-gray-500">{rowIdx + 1}</td>
                          {columns.map((col, colIdx) => (
                            <td key={colIdx} className="border px-2 py-1">
                              {getCellValue(item, col.key)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.length > 5 && (
                    <div className="p-2 text-center text-gray-500 border-t">
                      ... {data.length - 5} autres lignes
                    </div>
                  )}

                  <div className="p-2 bg-gray-100 border-t text-center text-gray-600 italic text-xs">
                    {config.footerLine1}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-shrink-0 flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Fermer
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button variant="outline" onClick={handlePreviewPDF} className="text-amber-600 border-amber-300 hover:bg-amber-50">
            <Download className="h-4 w-4 mr-2" />
            Aperçu PDF
          </Button>
          <Button variant="default" onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700">
            <FileText className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
          <Button variant="default" onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exporter Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
