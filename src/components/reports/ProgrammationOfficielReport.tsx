/**
 * Rapport Officiel de Programmation des Dépenses
 * Format conforme aux standards DGDA avec en-tête, logo et signatures
 */

import { useMemo } from 'react';
import { formatMontant } from '@/lib/utils';
import dgdaLogo from '@/assets/dgda-logo-new.jpg';
import { useOfficialReportsConfig, OfficialReportConfig } from '@/hooks/useOfficialReportsConfig';

interface ProgrammationItem {
  numero: number;
  libelle: string;
  montant: number;
}

interface ProgrammationOfficielReportProps {
  data: ProgrammationItem[];
  mois: string;
  annee: number;
  reference?: string;
  totalEnLettres?: string;
  sousDirecteur?: string;
  directeurProvincial?: string;
  config?: OfficialReportConfig; // Config optionnelle pour aperçu en temps réel
}

export function ProgrammationOfficielReport({
  data,
  mois,
  annee,
  reference,
  totalEnLettres,
  sousDirecteur,
  directeurProvincial,
  config: configProp
}: ProgrammationOfficielReportProps) {
  
  // Charger la configuration depuis le hook ou utiliser celle fournie en prop
  const { getConfig } = useOfficialReportsConfig();
  const config = configProp || getConfig('programmation');
  
  const totalMontant = useMemo(() => {
    return data.reduce((acc, item) => acc + item.montant, 0);
  }, [data]);

  const currentDate = new Date();
  const dateFormatted = `Fait à Kinshasa, le ${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;

  // Utiliser les valeurs de configuration ou les props comme fallback
  const finalReference = reference || `${config.referencePrefix}${annee}`;
  const finalSousDirecteur = sousDirecteur || config.signatureName1;
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
      </div>

      {/* Référence */}
      <div className="flex justify-between items-start mb-6 text-[10pt]">
        <div className="font-bold">
          {finalReference}
        </div>
      </div>

      {/* Titre du rapport */}
      <div className="text-center mb-6">
        <h1 
          className="font-bold underline"
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
            {visibleColumns.length > 0 ? (
              visibleColumns.map((column) => (
                <th 
                  key={column.id}
                  className="p-2 text-center font-bold"
                  style={{ 
                    border: `1px solid ${config.borderColor}`,
                    width: column.id === 'numero' ? '40px' : column.id === 'montant' ? '120px' : 'auto',
                    textAlign: column.id === 'montant' ? 'right' : column.id === 'designation' ? 'left' : 'center'
                  }}
                >
                  {column.label}
                </th>
              ))
            ) : (
              // Colonnes par défaut si aucune colonne configurée
              <>
                <th className="p-2 text-center font-bold w-[40px]" style={{ border: `1px solid ${config.borderColor}` }}>
                  N°
                </th>
                <th className="p-2 text-left font-bold" style={{ border: `1px solid ${config.borderColor}` }}>
                  LIBELLE
                </th>
                <th className="p-2 text-right font-bold w-[120px]" style={{ border: `1px solid ${config.borderColor}` }}>
                  MONTANT
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr 
              key={item.numero}
              style={{ 
                backgroundColor: index % 2 === 1 ? config.alternateRowColor : 'transparent' 
              }}
            >
              {visibleColumns.length > 0 ? (
                visibleColumns.map((column) => {
                  let content = '';
                  if (column.field === 'numero_ordre' || column.id === 'numero') content = String(item.numero);
                  else if (column.field === 'designation' || column.id === 'designation') content = item.libelle;
                  else if (column.field === 'montant_prevu' || column.id === 'montant') content = formatMontant(item.montant);
                  
                  return (
                    <td 
                      key={column.id}
                      className="p-2"
                      style={{ 
                        border: `1px solid ${config.borderColor}`,
                        textAlign: column.id === 'montant' ? 'right' : column.id === 'numero' ? 'center' : 'left',
                        fontFamily: column.id === 'montant' ? 'monospace' : 'inherit'
                      }}
                    >
                      {content}
                    </td>
                  );
                })
              ) : (
                // Colonnes par défaut
                <>
                  <td className="p-2 text-center" style={{ border: `1px solid ${config.borderColor}` }}>
                    {item.numero}
                  </td>
                  <td className="p-2" style={{ border: `1px solid ${config.borderColor}` }}>
                    {item.libelle}
                  </td>
                  <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>
                    {formatMontant(item.montant)}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold" style={{ backgroundColor: config.alternateRowColor }}>
            <td 
              colSpan={visibleColumns.length > 0 ? visibleColumns.length - 1 : 2} 
              className="p-2 text-right"
              style={{ border: `1px solid ${config.borderColor}` }}
            >
              MONTANT TOTAL
            </td>
            <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>
              {formatMontant(totalMontant)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Montant en lettres */}
      {totalEnLettres && (
        <div className="mb-6 text-center italic text-[9pt]">
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
            <p className="font-bold underline">{finalSousDirecteur}</p>
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
export function ProgrammationOfficielReportPrint(props: ProgrammationOfficielReportProps) {
  return (
    <div className="print-only">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .print-only {
              display: block !important;
            }
          }
        `}
      </style>
      <ProgrammationOfficielReport {...props} />
    </div>
  );
}
