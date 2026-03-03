/**
 * Rapport Officiel Sommaire Mensuel
 * Format conforme aux standards DGDA avec en-tête, logo et signatures
 */

import { useMemo } from 'react';
import { formatMontant } from '@/lib/utils';
import dgdaLogo from '@/assets/dgda-logo-new.jpg';
import { useOfficialReportsConfig, OfficialReportConfig } from '@/hooks/useOfficialReportsConfig';

interface SommaireItem {
  article: string;
  designation: string;
  recette?: number;
  depense?: number;
}

interface SommaireOfficielReportProps {
  data: SommaireItem[];
  mois: string;
  annee: number;
  soldeInitial?: number;
  reference?: string;
  totalEnLettres?: string;
  comptable?: string;
  directeurProvincial?: string;
  config?: OfficialReportConfig; // Config optionnelle pour aperçu en temps réel
}

export function SommaireOfficielReport({
  data,
  mois,
  annee,
  soldeInitial = 0,
  reference,
  totalEnLettres,
  comptable,
  directeurProvincial,
  config: configProp
}: SommaireOfficielReportProps) {
  
  // Charger la configuration depuis le hook ou utiliser celle fournie en prop
  const { getConfig } = useOfficialReportsConfig();
  const config = configProp || getConfig('sommaire');
  
  // Calculer les totaux
  const totaux = useMemo(() => {
    const totalRecettes = data.reduce((acc, item) => acc + (item.recette || 0), 0);
    const totalDepenses = data.reduce((acc, item) => acc + (item.depense || 0), 0);
    const encaisse = totalRecettes + soldeInitial;
    const balance = encaisse - totalDepenses;
    
    return {
      recettes: totalRecettes,
      depenses: totalDepenses,
      encaisse: encaisse,
      balance: balance
    };
  }, [data, soldeInitial]);

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
        
        {config.headerLine4 && (
          <div className="text-[10pt] italic mt-2">
            <p className="font-semibold">{config.headerLine4}</p>
          </div>
        )}
      </div>

      {/* Référence et titre */}
      <div className="mb-6">
        <div className="text-right text-[10pt] mb-2">
          <span className="font-semibold">{finalReference}</span>
        </div>
        <h1 
          className="font-bold text-center underline"
          style={{
            fontFamily: config.titleFont,
            fontSize: `${config.titleSize}pt`,
            color: config.headerColor
          }}
        >
          {titre}
        </h1>
      </div>

      {/* Tableau des données */}
      <table className="w-full border-collapse mb-4" style={{ fontSize: `${config.textSize}pt` }}>
        <thead>
          <tr style={{ backgroundColor: config.alternateRowColor }}>
            <th className="p-2 text-center font-bold w-[80px]" style={{ border: `1px solid ${config.borderColor}` }}>
              ART.
            </th>
            <th className="p-2 text-center font-bold" style={{ border: `1px solid ${config.borderColor}` }}>
              DESIGNATION
            </th>
            <th className="p-2 text-center font-bold" colSpan={2} style={{ border: `1px solid ${config.borderColor}` }}>
              ART.
            </th>
          </tr>
          <tr style={{ backgroundColor: config.alternateRowColor }}>
            <th className="p-1" style={{ border: `1px solid ${config.borderColor}` }}></th>
            <th className="p-1" style={{ border: `1px solid ${config.borderColor}` }}></th>
            <th className="p-2 text-center font-bold w-[120px]" style={{ border: `1px solid ${config.borderColor}` }}>
              RECETTES
            </th>
            <th className="p-2 text-center font-bold w-[120px]" style={{ border: `1px solid ${config.borderColor}` }}>
              DEPENSES
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Solde initial */}
          {soldeInitial > 0 && (
            <tr style={{ backgroundColor: config.accentColor + '10' }}>
              <td className="p-2 text-center font-bold" style={{ border: `1px solid ${config.borderColor}` }}>
                707820
              </td>
              <td className="p-2 font-semibold" style={{ border: `1px solid ${config.borderColor}` }}>
                Solde du {new Date(annee, new Date().getMonth() - 1, 30).toLocaleDateString('fr-FR')}
              </td>
              <td className="p-2 text-right font-mono font-semibold" style={{ border: `1px solid ${config.borderColor}` }}>
                {formatMontant(soldeInitial)}
              </td>
              <td className="p-2" style={{ border: `1px solid ${config.borderColor}` }}></td>
            </tr>
          )}
          
          {/* Données */}
          {data.map((item, index) => (
            <tr 
              key={index} 
              style={{ 
                backgroundColor: index % 2 === 1 ? config.alternateRowColor : 'transparent' 
              }}
            >
              <td className="p-2 text-center" style={{ border: `1px solid ${config.borderColor}` }}>
                {item.article}
              </td>
              <td className="p-2 text-[8pt]" style={{ border: `1px solid ${config.borderColor}` }}>
                {item.designation}
              </td>
              <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>
                {item.recette ? formatMontant(item.recette) : ''}
              </td>
              <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>
                {item.depense ? formatMontant(item.depense) : ''}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold" style={{ backgroundColor: config.alternateRowColor }}>
            <td colSpan={2} className="p-2 text-right" style={{ border: `1px solid ${config.borderColor}` }}>
              TOTAL
            </td>
            <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>
              {formatMontant(totaux.recettes + soldeInitial)}
            </td>
            <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>
              {formatMontant(totaux.depenses)}
            </td>
          </tr>
          <tr className="font-bold" style={{ backgroundColor: config.alternateRowColor }}>
            <td colSpan={2} className="p-2 text-right" style={{ border: `1px solid ${config.borderColor}` }}>
              ENCAISSE
            </td>
            <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>
              {formatMontant(totaux.encaisse)}
            </td>
            <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>
              {formatMontant(totaux.depenses)}
            </td>
          </tr>
          <tr className="font-bold" style={{ backgroundColor: config.alternateRowColor }}>
            <td colSpan={2} className="p-2 text-right" style={{ border: `1px solid ${config.borderColor}` }}>
              BALANCE
            </td>
            <td className="p-2 text-right font-mono" colSpan={2} style={{ border: `1px solid ${config.borderColor}` }}>
              {formatMontant(totaux.balance)}
            </td>
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

      {/* Signature */}
      <div className="text-center mb-8 text-[10pt]">
        <p className="font-bold mb-16">{config.signatureTitle1.toUpperCase()}</p>
        <div className="mt-12">
          <p className="font-bold">{finalComptable}</p>
        </div>
      </div>

      {/* Pied de page */}
      <div className="border-t-2 border-gray-400 pt-4 mt-8 text-[7pt]">
        <div className="text-center italic">
          <p className="text-right mb-2 not-italic">Page 2 de 2</p>
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
export function SommaireOfficielReportPrint(props: SommaireOfficielReportProps) {
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
      <SommaireOfficielReport {...props} />
    </div>
  );
}
