/**
 * Rapport Officiel Feuille de Caisse
 * Format conforme au Crystal Report MVTCAISSEF — police Courier New 10pt
 * Structure : En-tête colonnes → Groupe par Date_Mvt_A → Pied de page (Total/Encaisse/Balance)
 */

import { useMemo } from 'react';
import { formatMontant } from '@/lib/utils';
import { useOfficialReportsConfig, OfficialReportConfig } from '@/hooks/useOfficialReportsConfig';
import { OfficialReportLayout, OfficialReportPrintWrapper } from './OfficialReportLayout';

export interface FeuilleCaisseItem {
  date: string;
  numeroOrdre: number;
  numeroBEO: string;
  libelle: string;
  recette: number;
  depense: number;
  imp?: string;
}

export interface FeuilleCaisseOfficielReportProps {
  data: FeuilleCaisseItem[];
  mois: string;
  annee: number;
  dateFeuille: string;
  nomComptable: string;
  soldeInitial?: number;
  reference?: string;
  totalEnLettres?: string;
  config?: OfficialReportConfig;
}

/** Grouper les lignes par date (Groupe n°1 : MVTCAISSEF.Date_Mvt_A) */
function groupByDate(data: FeuilleCaisseItem[]): Map<string, FeuilleCaisseItem[]> {
  const groups = new Map<string, FeuilleCaisseItem[]>();
  data.forEach(item => {
    const key = item.date;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  });
  return groups;
}

const courierStyle = "font-family: 'Courier New', Courier, monospace; font-size: 10pt;";
const cellBorder = "border: 1px solid #000; padding: 2px 4px;";

export function FeuilleCaisseOfficielReport({
  data,
  mois,
  annee,
  dateFeuille,
  nomComptable,
  soldeInitial = 0,
  reference,
  totalEnLettres,
  config: configProp,
}: FeuilleCaisseOfficielReportProps) {
  const { getConfig } = useOfficialReportsConfig();
  const config = configProp || getConfig('feuilleCaisse');

  const groupedData = useMemo(() => groupByDate(data), [data]);

  const totaux = useMemo(() => {
    const totalRecettes = data.reduce((acc, item) => acc + (item.recette || 0), 0);
    const totalDepenses = data.reduce((acc, item) => acc + (item.depense || 0), 0);
    const solde = totalRecettes - totalDepenses;
    const balance = soldeInitial + solde;
    return { recettes: totalRecettes, depenses: totalDepenses, solde, balance };
  }, [data, soldeInitial]);

  const finalReference = reference || `${config.referencePrefix}${annee}`;
  const titre = `FEUILLE DE CAISSE — MOIS DE ${mois.toUpperCase()} ${annee}`;

  const signatures = [
    { title: 'COMPTABLE PROVINCIALE DES DEPENSES', name: nomComptable },
  ];

  return (
    <OfficialReportLayout
      config={config}
      titre={titre}
      reference={finalReference}
      totalEnLettres={totalEnLettres}
      signatures={signatures}
    >
      {/* === TABLEAU FEUILLE DE CAISSE === */}
      <table
        className="w-full border-collapse mb-4"
        style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '10pt' }}
      >
        {/* 1. En-tête du tableau */}
        <thead>
          <tr style={{ backgroundColor: '#e5e7eb' }}>
            <th style={{ ...parseStyle(cellBorder), width: '70px', textAlign: 'center' }}>Date</th>
            <th style={{ ...parseStyle(cellBorder), width: '50px', textAlign: 'center' }}>N°ORD</th>
            <th style={{ ...parseStyle(cellBorder), width: '65px', textAlign: 'center' }}>N°BEO</th>
            <th style={{ ...parseStyle(cellBorder), textAlign: 'left' }}>LIBELLE</th>
            <th style={{ ...parseStyle(cellBorder), textAlign: 'center' }} colSpan={3}>MONTANT</th>
          </tr>
          <tr style={{ backgroundColor: '#e5e7eb' }}>
            <th style={{ ...parseStyle(cellBorder) }} colSpan={4}></th>
            <th style={{ ...parseStyle(cellBorder), width: '100px', textAlign: 'center' }}>RECETTE</th>
            <th style={{ ...parseStyle(cellBorder), width: '100px', textAlign: 'center' }}>DEPENSE</th>
            <th style={{ ...parseStyle(cellBorder), width: '50px', textAlign: 'center' }}>IMP</th>
          </tr>
        </thead>

        <tbody>
          {/* 2. Groupes par date (MVTCAISSEF.Date_Mvt_A) */}
          {Array.from(groupedData.entries()).map(([dateKey, rows]) => {
            const groupRecettes = rows.reduce((s, r) => s + (r.recette || 0), 0);
            const groupDepenses = rows.reduce((s, r) => s + (r.depense || 0), 0);

            return (
              <GroupeDate
                key={dateKey}
                dateKey={dateKey}
                rows={rows}
                groupRecettes={groupRecettes}
                groupDepenses={groupDepenses}
              />
            );
          })}
        </tbody>

        {/* 5. Pied de page du tableau */}
        <tfoot>
          {/* Total */}
          <tr style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold' }}>
            <td style={{ ...parseStyle(cellBorder), textAlign: 'right' }} colSpan={4}>TOTAL</td>
            <td style={{ ...parseStyle(cellBorder), textAlign: 'right' }}>{formatMontant(totaux.recettes)}</td>
            <td style={{ ...parseStyle(cellBorder), textAlign: 'right' }}>{formatMontant(totaux.depenses)}</td>
            <td style={{ ...parseStyle(cellBorder) }}></td>
          </tr>
          {/* Encaisse (solde = recettes - dépenses) */}
          <tr style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold' }}>
            <td style={{ ...parseStyle(cellBorder), textAlign: 'right' }} colSpan={4}>ENCAISSE :</td>
            <td style={{ ...parseStyle(cellBorder), textAlign: 'right' }} colSpan={2}>{formatMontant(totaux.solde)}</td>
            <td style={{ ...parseStyle(cellBorder) }}></td>
          </tr>
          {/* Balance (solde initial + solde courant) */}
          <tr style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold' }}>
            <td style={{ ...parseStyle(cellBorder), textAlign: 'right' }} colSpan={4}>BALANCE :</td>
            <td style={{ ...parseStyle(cellBorder), textAlign: 'right' }} colSpan={2}>{formatMontant(totaux.balance)}</td>
            <td style={{ ...parseStyle(cellBorder) }}></td>
          </tr>
        </tfoot>
      </table>

      {/* Nous disons */}
      {totalEnLettres && (
        <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '10pt', marginTop: '8px' }}>
          <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Nous disons : </span>
          <span style={{ fontStyle: 'italic' }}>{totalEnLettres}</span>
        </div>
      )}

      {/* Date de la feuille de caisse */}
      <div style={{ textAlign: 'right', marginTop: '16px', fontFamily: "'Courier New', Courier, monospace", fontSize: '10pt' }}>
        Fait à Kinshasa, le {dateFeuille}
      </div>

      {/* Signature : COMPTABLE PROVINCIALE DES DEPENSES + Nom */}
      <div style={{ textAlign: 'right', marginTop: '24px', fontFamily: "'Courier New', Courier, monospace", fontSize: '10pt' }}>
        <p style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>COMPTABLE PROVINCIALE DES DEPENSES</p>
        <p style={{ marginTop: '40px', fontWeight: 'bold', textDecoration: 'underline' }}>{nomComptable}</p>
      </div>
    </OfficialReportLayout>
  );
}

/** Composant interne : Groupe par date (n°1) */
function GroupeDate({
  dateKey,
  rows,
  groupRecettes,
  groupDepenses,
}: {
  dateKey: string;
  rows: FeuilleCaisseItem[];
  groupRecettes: number;
  groupDepenses: number;
}) {
  const dateFormatted = new Date(dateKey).toLocaleDateString('fr-FR');

  return (
    <>
      {/* En-tête du groupe n°1 : date */}
      <tr style={{ backgroundColor: '#f3f4f6' }}>
        <td
          style={{ ...parseStyle(cellBorder), fontWeight: 'bold', textAlign: 'center' }}
          colSpan={7}
        >
          {dateFormatted}
        </td>
      </tr>

      {/* Lignes de données du groupe */}
      {rows.map((item, idx) => (
        <tr key={`${dateKey}-${idx}`}>
          <td style={{ ...parseStyle(cellBorder), textAlign: 'center' }}>{dateFormatted}</td>
          <td style={{ ...parseStyle(cellBorder), textAlign: 'center' }}>{item.numeroOrdre}</td>
          <td style={{ ...parseStyle(cellBorder), textAlign: 'center' }}>{item.numeroBEO}</td>
          <td style={{ ...parseStyle(cellBorder) }}>{item.libelle}</td>
          <td style={{ ...parseStyle(cellBorder), textAlign: 'right' }}>
            {item.recette ? formatMontant(item.recette) : ''}
          </td>
          <td style={{ ...parseStyle(cellBorder), textAlign: 'right' }}>
            {item.depense ? formatMontant(item.depense) : ''}
          </td>
          <td style={{ ...parseStyle(cellBorder), textAlign: 'center' }}>{item.imp || ''}</td>
        </tr>
      ))}

      {/* Pied de page du groupe n°1a : sous-total recettes */}
      <tr style={{ backgroundColor: '#f9fafb', fontStyle: 'italic' }}>
        <td style={{ ...parseStyle(cellBorder) }} colSpan={4} />
        <td style={{ ...parseStyle(cellBorder), textAlign: 'right', fontWeight: 'bold' }}>
          {groupRecettes > 0 ? formatMontant(groupRecettes) : ''}
        </td>
        <td style={{ ...parseStyle(cellBorder) }} />
        <td style={{ ...parseStyle(cellBorder) }} />
      </tr>
      {/* Pied de page du groupe n°1b : sous-total dépenses */}
      <tr style={{ backgroundColor: '#f9fafb', fontStyle: 'italic' }}>
        <td style={{ ...parseStyle(cellBorder) }} colSpan={4} />
        <td style={{ ...parseStyle(cellBorder) }} />
        <td style={{ ...parseStyle(cellBorder), textAlign: 'right', fontWeight: 'bold' }}>
          {groupDepenses > 0 ? formatMontant(groupDepenses) : ''}
        </td>
        <td style={{ ...parseStyle(cellBorder) }} />
      </tr>
    </>
  );
}

/** Helper : convertit une string CSS inline en objet React */
function parseStyle(css: string): React.CSSProperties {
  const style: Record<string, string> = {};
  css.split(';').forEach(rule => {
    const [key, value] = rule.split(':').map(s => s.trim());
    if (key && value) {
      const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      style[camelKey] = value;
    }
  });
  return style as React.CSSProperties;
}

export function FeuilleCaisseOfficielReportPrint(props: FeuilleCaisseOfficielReportProps) {
  return (
    <OfficialReportPrintWrapper>
      <FeuilleCaisseOfficielReport {...props} />
    </OfficialReportPrintWrapper>
  );
}
