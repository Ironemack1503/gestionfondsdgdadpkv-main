/**
 * Rapport Officiel Feuille de Caisse
 * Format conforme aux standards DGDA avec en-tête, logo et signatures
 */

import { useMemo } from 'react';
import { formatMontant } from '@/lib/utils';
import dgdaLogo from '@/assets/dgda-logo-new.jpg';
import { useOfficialReportsConfig, OfficialReportConfig } from '@/hooks/useOfficialReportsConfig';

interface FeuilleCaisseItem {
  date: string;
  numeroOrdre: number;
  numeroBEO: string;
  libelle: string;
  recette?: number;
  depense?: number;
  imp?: string;
}

interface FeuilleCaisseOfficielReportProps {
  data: FeuilleCaisseItem[];
  mois: string;
  annee: number;
  soldeInitial?: number;
  reference?: string;
  totalEnLettres?: string;
  comptable?: string;
  directeurProvincial?: string;
  config?: OfficialReportConfig; // Config optionnelle pour aperçu en temps réel
}

export function FeuilleCaisseOfficielReport({
  data,
  mois,
  annee,
  soldeInitial = 0,
  reference,
  totalEnLettres,
  comptable,
  directeurProvincial,
  config: configProp
}: FeuilleCaisseOfficielReportProps) {
  
  // Charger la configuration depuis le hook ou utiliser celle fournie en prop
  const { getConfig } = useOfficialReportsConfig();
  const config = configProp || getConfig('feuilleCaisse');
  
  // Calculer les totaux
  const totaux = useMemo(() => {
    const totalRecettes = data.reduce((acc, item) => acc + (item.recette || 0), 0);
    const totalDepenses = data.reduce((acc, item) => acc + (item.depense || 0), 0);
    const balance = totalRecettes - totalDepenses;
    
    return {
      recettes: totalRecettes,
      depenses: totalDepenses,
      encaisse: totalRecettes,
      balance: balance
    };
  }, [data]);

  const currentDate = new Date();
  const dateFormatted = `Fait à Kinshasa, le ${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;

  // Utiliser les valeurs de configuration ou les props comme fallback
  const finalReference = reference || `${config.referencePrefix}${annee}`;
  const finalComptable = comptable || config.signatureName1;
  const finalDirecteurProvincial = directeurProvincial || config.signatureName2;
  
  // Remplacer les variables dans le titre
  const titre = config.titleTemplate
    .replace('{MOIS}', mois.toUpperCase())
    .replace('{ANNEE}', annee.toString());

  // Colonnes visibles triées par ordre
  const visibleColumns = (config.columns || [])
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div 
      className="bg-white text-black p-8 max-w-[210mm] mx-auto"
      style={{ fontFamily: config.bodyFont }}
    >
      {/* En-tête officiel */}
      <div className="text-center mb-6">
        <div className="text-[10pt] leading-[1.4]">
          <p className="font-semibold">{config.headerLine1}</p>
          <p className="font-semibold">{config.headerLine2}</p>
          <p className="font-semibold">{config.headerLine3}</p>
          <p className="font-bold">D.G.D.A</p>
          {config.headerLine4 && <p className="font-semibold">{config.headerLine4}</p>}
        </div>
        
        {/* Logo DGDA */}
        {config.showLogo && (
          <div className="flex justify-center my-4">
            <img 
              src={dgdaLogo} 
              alt="Logo DGDA" 
              className="object-contain"
              width={config.logoSize}
              height={config.logoSize}
            />
          </div>
        )}
        
        <div className="text-[10pt] font-bold underline mt-2">
          BUREAU COMPTABLE
        </div>
      </div>

      {/* Titre du rapport */}
      <div className="flex justify-between items-center mb-6">
        <h1 
          className="font-bold"
          style={{
            fontFamily: config.titleFont,
            fontSize: `${config.titleSize}pt`,
            color: config.headerColor
          }}
        >
          FEUILLE DE CAISSE
        </h1>
        <h2 
          className="font-bold"
          style={{
            fontFamily: config.titleFont,
            fontSize: `${config.titleSize}pt`,
            color: config.headerColor
          }}
        >
          MOIS DE {mois.toUpperCase()} {annee}
        </h2>
      </div>

      {/* Tableau des données */}
      <table className="w-full border-collapse mb-4" style={{ fontSize: `${config.textSize - 2}pt` }}>
        <thead>
          <tr style={{ backgroundColor: config.alternateRowColor }}>
            <th className="p-1 text-center font-bold w-[60px]" style={{ border: `1px solid ${config.borderColor}` }}>
              Date
            </th>
            <th className="p-1 text-center font-bold w-[35px]" style={{ border: `1px solid ${config.borderColor}` }}>
              N°ord
            </th>
            <th className="p-1 text-center font-bold w-[45px]" style={{ border: `1px solid ${config.borderColor}` }}>
              N°BEO
            </th>
            <th className="p-1 text-left font-bold" style={{ border: `1px solid ${config.borderColor}` }}>
              LIBELLE
            </th>
            <th className="p-1 text-center font-bold" colSpan={3} style={{ border: `1px solid ${config.borderColor}` }}>
              MONTANT
            </th>
          </tr>
          <tr style={{ backgroundColor: config.alternateRowColor }}>
            <th className="p-1" colSpan={4} style={{ border: `1px solid ${config.borderColor}` }}></th>
            <th className="p-1 text-center font-bold w-[90px]" style={{ border: `1px solid ${config.borderColor}` }}>
              RECETTE
            </th>
            <th className="p-1 text-center font-bold w-[90px]" style={{ border: `1px solid ${config.borderColor}` }}>
              DEPENSE
            </th>
            <th className="p-1 text-center font-bold w-[60px]" style={{ border: `1px solid ${config.borderColor}` }}>
              IMP
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr 
              key={index} 
              style={{ 
                backgroundColor: index % 2 === 1 ? config.alternateRowColor : 'transparent' 
              }}
            >
              <td className="p-1 text-center text-[7pt]" style={{ border: `1px solid ${config.borderColor}` }}>
                {item.date}
              </td>
              <td className="p-1 text-center font-bold" style={{ border: `1px solid ${config.borderColor}` }}>
                {item.numeroOrdre}
              </td>
              <td className="p-1 text-center" style={{ border: `1px solid ${config.borderColor}` }}>
                {item.numeroBEO}
              </td>
              <td className="p-1 text-[7pt]" style={{ border: `1px solid ${config.borderColor}` }}>
                {item.libelle}
              </td>
              <td className="p-1 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>
                {item.recette ? formatMontant(item.recette) : ''}
              </td>
              <td className="p-1 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>
                {item.depense ? formatMontant(item.depense) : ''}
              </td>
              <td className="p-1 text-center text-[7pt]" style={{ border: `1px solid ${config.borderColor}` }}>
                {item.imp || ''}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold" style={{ backgroundColor: config.alternateRowColor }}>
            <td colSpan={4} className="p-2 text-right" style={{ border: `1px solid ${config.borderColor}` }}>
              TOTAL
            </td>
            <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>
              {formatMontant(totaux.recettes)}
            </td>
            <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>
              {formatMontant(totaux.depenses)}
            </td>
            <td className="p-2" style={{ border: `1px solid ${config.borderColor}` }}></td>
          </tr>
          <tr className="font-bold" style={{ backgroundColor: config.alternateRowColor }}>
            <td colSpan={4} className="p-2 text-right" style={{ border: `1px solid ${config.borderColor}` }}>
              ENCAISSE:
            </td>
            <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>
              {formatMontant(totaux.encaisse)}
            </td>
            <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>
              {formatMontant(totaux.depenses)}
            </td>
            <td className="p-2" style={{ border: `1px solid ${config.borderColor}` }}></td>
          </tr>
          <tr className="font-bold" style={{ backgroundColor: config.alternateRowColor }}>
            <td colSpan={4} className="p-2 text-right" style={{ border: `1px solid ${config.borderColor}` }}>
              BALANCE:
            </td>
            <td className="p-2 text-right font-mono" colSpan={2} style={{ border: `1px solid ${config.borderColor}` }}>
              {formatMontant(totaux.balance)}
            </td>
            <td className="p-2" style={{ border: `1px solid ${config.borderColor}` }}></td>
          </tr>
        </tfoot>
      </table>

      {/* Montant en lettres */}
      {totalEnLettres && (
        <div className="mb-6 text-[9pt] italic">
          <p>
            <span className="font-semibold">Nous disons:</span> {totalEnLettres}
          </p>
        </div>
      )}

      {/* Date et lieu */}
      <div className="text-right mb-8 text-[10pt]">
        <p className="italic">{dateFormatted}</p>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mb-8 text-[9pt]">
        <div className="text-center">
          <p className="font-bold mb-16">{config.signatureTitle1.toUpperCase()}</p>
          <div className="mt-12">
            <p className="font-bold underline">{finalComptable}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="font-bold mb-16">{config.signatureTitle2.toUpperCase()}</p>
          <div className="mt-12">
            <p className="font-bold underline">{finalDirecteurProvincial}</p>
          </div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="border-t-2 border-gray-400 pt-4 mt-8 text-[7pt]">
        <div className="text-center italic">
          {config.footerLine1 && <p className="font-semibold mb-1">{config.footerLine1}</p>}
          {config.footerLine2 && <p>{config.footerLine2}</p>}
          {config.footerLine3 && <p>{config.footerLine3}</p>}
          {config.footerLine4 && <p>{config.footerLine4}</p>}
        </div>
      </div>
    </div>
  );
}

// Export version for print/PDF
export function FeuilleCaisseOfficielReportPrint(props: FeuilleCaisseOfficielReportProps) {
  return (
    <div className="print-only">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 1cm;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}
      </style>
      <FeuilleCaisseOfficielReport {...props} />
    </div>
  );
}
