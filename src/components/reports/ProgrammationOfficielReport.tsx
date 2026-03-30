/**
 * Rapport Officiel de Programmation des Dépenses
 * Format conforme aux standards DGDA — utilise OfficialReportLayout partagé
 */

import { useMemo } from 'react';
import { formatMontant } from '@/lib/utils';
import { useOfficialReportsConfig, OfficialReportConfig } from '@/hooks/useOfficialReportsConfig';
import { OfficialReportLayout, OfficialReportPrintWrapper } from './OfficialReportLayout';

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
  config?: OfficialReportConfig;
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

  const { getConfig } = useOfficialReportsConfig();
  const config = configProp || getConfig('programmation');

  const totalMontant = useMemo(() => {
    return data.reduce((acc, item) => acc + item.montant, 0);
  }, [data]);

  const finalReference = reference || `${config.referencePrefix}${annee}`;
  const titre = config.titleTemplate
    .replace('{MOIS}', mois.toUpperCase())
    .replace('{ANNEE}', annee.toString());

  const visibleColumns = (config.columns || [])
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order);

  const signatures = [
    { title: config.signatureTitle1, name: sousDirecteur || config.signatureName1 },
    { title: config.signatureTitle2, name: directeurProvincial || config.signatureName2 },
  ];

  return (
    <OfficialReportLayout
      config={config}
      titre={titre}
      reference={finalReference}
      totalEnLettres={totalEnLettres}
      signatures={signatures}
    >
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
              <>
                <th className="p-2 text-center font-bold w-[40px]" style={{ border: `1px solid ${config.borderColor}` }}>N°</th>
                <th className="p-2 text-left font-bold" style={{ border: `1px solid ${config.borderColor}` }}>LIBELLE</th>
                <th className="p-2 text-right font-bold w-[120px]" style={{ border: `1px solid ${config.borderColor}` }}>MONTANT</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.numero} style={{ backgroundColor: index % 2 === 1 ? config.alternateRowColor : 'transparent' }}>
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
                <>
                  <td className="p-2 text-center" style={{ border: `1px solid ${config.borderColor}` }}>{item.numero}</td>
                  <td className="p-2" style={{ border: `1px solid ${config.borderColor}` }}>{item.libelle}</td>
                  <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>{formatMontant(item.montant)}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold" style={{ backgroundColor: config.alternateRowColor }}>
            <td colSpan={visibleColumns.length > 0 ? visibleColumns.length - 1 : 2} className="p-2 text-right" style={{ border: `1px solid ${config.borderColor}` }}>
              MONTANT TOTAL
            </td>
            <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>{formatMontant(totalMontant)}</td>
          </tr>
        </tfoot>
      </table>
    </OfficialReportLayout>
  );
}

export function ProgrammationOfficielReportPrint(props: ProgrammationOfficielReportProps) {
  return (
    <OfficialReportPrintWrapper>
      <ProgrammationOfficielReport {...props} />
    </OfficialReportPrintWrapper>
  );
}
