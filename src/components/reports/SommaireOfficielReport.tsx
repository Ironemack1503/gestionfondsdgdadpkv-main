/**
 * Rapport Officiel Sommaire Mensuel
 * Format conforme aux standards DGDA — utilise OfficialReportLayout partagé
 */

import { useMemo } from 'react';
import { formatMontant } from '@/lib/utils';
import { useOfficialReportsConfig, OfficialReportConfig } from '@/hooks/useOfficialReportsConfig';
import { OfficialReportLayout, OfficialReportPrintWrapper } from './OfficialReportLayout';

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
  config?: OfficialReportConfig;
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

  const { getConfig } = useOfficialReportsConfig();
  const config = configProp || getConfig('sommaire');

  const totaux = useMemo(() => {
    const totalRecettes = data.reduce((acc, item) => acc + (item.recette || 0), 0);
    const totalDepenses = data.reduce((acc, item) => acc + (item.depense || 0), 0);
    const encaisse = totalRecettes + soldeInitial;
    const balance = encaisse - totalDepenses;
    return { recettes: totalRecettes, depenses: totalDepenses, encaisse, balance };
  }, [data, soldeInitial]);

  const finalReference = reference || `${config.referencePrefix}${annee}`;
  const titre = config.titleTemplate
    .replace('{MOIS}', mois.toUpperCase())
    .replace('{ANNEE}', annee.toString());

  const signatures = [
    { title: config.signatureTitle1, name: comptable || config.signatureName1 },
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
            <th className="p-2 text-center font-bold w-[80px]" style={{ border: `1px solid ${config.borderColor}` }}>ART.</th>
            <th className="p-2 text-center font-bold" style={{ border: `1px solid ${config.borderColor}` }}>DESIGNATION</th>
            <th className="p-2 text-center font-bold" colSpan={2} style={{ border: `1px solid ${config.borderColor}` }}>ART.</th>
          </tr>
          <tr style={{ backgroundColor: config.alternateRowColor }}>
            <th className="p-1" style={{ border: `1px solid ${config.borderColor}` }}></th>
            <th className="p-1" style={{ border: `1px solid ${config.borderColor}` }}></th>
            <th className="p-2 text-center font-bold w-[120px]" style={{ border: `1px solid ${config.borderColor}` }}>RECETTES</th>
            <th className="p-2 text-center font-bold w-[120px]" style={{ border: `1px solid ${config.borderColor}` }}>DEPENSES</th>
          </tr>
        </thead>
        <tbody>
          {soldeInitial > 0 && (
            <tr style={{ backgroundColor: config.accentColor + '10' }}>
              <td className="p-2 text-center font-bold" style={{ border: `1px solid ${config.borderColor}` }}>707820</td>
              <td className="p-2 font-semibold" style={{ border: `1px solid ${config.borderColor}` }}>
                Solde du {new Date(annee, new Date().getMonth() - 1, 30).toLocaleDateString('fr-FR')}
              </td>
              <td className="p-2 text-right font-mono font-semibold" style={{ border: `1px solid ${config.borderColor}` }}>{formatMontant(soldeInitial)}</td>
              <td className="p-2" style={{ border: `1px solid ${config.borderColor}` }}></td>
            </tr>
          )}
          {data.map((item, index) => (
            <tr key={index} style={{ backgroundColor: index % 2 === 1 ? config.alternateRowColor : 'transparent' }}>
              <td className="p-2 text-center" style={{ border: `1px solid ${config.borderColor}` }}>{item.article}</td>
              <td className="p-2 text-[8pt]" style={{ border: `1px solid ${config.borderColor}` }}>{item.designation}</td>
              <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>{item.recette ? formatMontant(item.recette) : ''}</td>
              <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>{item.depense ? formatMontant(item.depense) : ''}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold" style={{ backgroundColor: config.alternateRowColor }}>
            <td colSpan={2} className="p-2 text-right" style={{ border: `1px solid ${config.borderColor}` }}>TOTAL</td>
            <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>{formatMontant(totaux.recettes + soldeInitial)}</td>
            <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>{formatMontant(totaux.depenses)}</td>
          </tr>
          <tr className="font-bold" style={{ backgroundColor: config.alternateRowColor }}>
            <td colSpan={2} className="p-2 text-right" style={{ border: `1px solid ${config.borderColor}` }}>ENCAISSE</td>
            <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>{formatMontant(totaux.encaisse)}</td>
            <td className="p-2 text-right font-mono" style={{ border: `1px solid ${config.borderColor}` }}>{formatMontant(totaux.depenses)}</td>
          </tr>
          <tr className="font-bold" style={{ backgroundColor: config.alternateRowColor }}>
            <td colSpan={2} className="p-2 text-right" style={{ border: `1px solid ${config.borderColor}` }}>BALANCE</td>
            <td className="p-2 text-right font-mono" colSpan={2} style={{ border: `1px solid ${config.borderColor}` }}>{formatMontant(totaux.balance)}</td>
          </tr>
        </tfoot>
      </table>
    </OfficialReportLayout>
  );
}

export function SommaireOfficielReportPrint(props: SommaireOfficielReportProps) {
  return (
    <OfficialReportPrintWrapper>
      <SommaireOfficielReport {...props} />
    </OfficialReportPrintWrapper>
  );
}
