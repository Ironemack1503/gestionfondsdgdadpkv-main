/**
 * OfficialReportLayout — Composant de mise en page partagé
 * Garantit la même présentation pour TOUS les rapports officiels DGDA.
 * Basé sur le format Crystal Reports original.
 */

import { ReactNode } from 'react';
import dgdaLogo from '@/assets/dgda-logo-new.jpg';
import { OfficialReportConfig } from '@/hooks/useOfficialReportsConfig';

interface SignatureBlock {
  title: string;
  name: string;
}

interface OfficialReportLayoutProps {
  config: OfficialReportConfig;
  titre: string;
  reference?: string;
  totalEnLettres?: string;
  signatures: SignatureBlock[];
  children: ReactNode;
}

export function OfficialReportLayout({
  config,
  titre,
  reference,
  totalEnLettres,
  signatures,
  children,
}: OfficialReportLayoutProps) {
  const currentDate = new Date();
  const dateFormatted = `Fait à Kinshasa, le ${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;

  return (
    <div
      className="bg-white text-black px-12 py-10 max-w-[210mm] mx-auto"
      style={{ fontFamily: config.bodyFont }}
    >
      {/* ═══ EN-TÊTE OFFICIEL ═══ */}
      <div className="text-center mb-2">
        <div className="text-[11pt] leading-[1.6] italic">
          <p>{config.headerLine1}</p>
          <p>{config.headerLine2}</p>
          <p>{config.headerLine3}</p>
          <p className="font-bold not-italic">D.G.D.A</p>
          {config.headerLine4 && <p>{config.headerLine4}</p>}
        </div>
      </div>

      {/* Logo DGDA */}
      {config.showLogo && (
        <div className="flex justify-center my-5">
          <img
            src={dgdaLogo}
            alt="Logo DGDA"
            className="object-contain"
            width={config.logoSize}
            height={config.logoSize}
          />
        </div>
      )}

      {/* BUREAU COMPTABLE */}
      <div className="text-center mb-8">
        <span className="text-[11pt] font-bold underline">
          BUREAU COMPTABLE
        </span>
      </div>

      {/* ═══ RÉFÉRENCE ═══ */}
      {reference && (
        <div className="text-right text-[11pt] mb-4">
          <span>{reference}</span>
        </div>
      )}

      {/* ═══ TITRE DU RAPPORT ═══ */}
      <div className="text-center mb-8">
        <h1
          className="font-bold underline"
          style={{
            fontFamily: config.titleFont,
            fontSize: `${config.titleSize}pt`,
            color: config.headerColor,
          }}
        >
          {titre}
        </h1>
      </div>

      {/* ═══ CONTENU DU RAPPORT (tableau spécifique) ═══ */}
      {children}

      {/* ═══ MONTANT EN LETTRES ═══ */}
      {totalEnLettres && (
        <div className="mt-4 mb-6 text-[10pt]">
          <p>
            <span className="font-bold italic" style={{ color: config.headerColor }}>Nous disons : </span>
            <span className="italic">{totalEnLettres}</span>
          </p>
        </div>
      )}

      {/* ═══ DATE ET LIEU ═══ */}
      <div className="text-right mb-10 mt-6 text-[11pt]">
        <p className="italic">{dateFormatted}</p>
      </div>

      {/* ═══ SIGNATURES ═══ */}
      <div
        className="mt-4 mb-8"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${signatures.length}, 1fr)`,
          gap: '4rem',
        }}
      >
        {signatures.map((sig, i) => (
          <div key={i} className="text-center">
            <p className="font-bold text-[11pt] tracking-wide">
              {sig.title.toUpperCase()}
            </p>
            {sig.name && (
              <div className="mt-20">
                <p className="font-bold underline text-[10pt]">{sig.name}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ═══ PIED DE PAGE ═══ */}
      {(config.footerLine1 || config.footerLine2 || config.footerLine3 || config.footerLine4) && (
        <div className="border-t border-gray-400 pt-3 mt-12 text-[7pt]">
          <div className="text-center italic text-gray-600">
            {config.footerLine1 && <p className="mb-0.5">{config.footerLine1}</p>}
            {config.footerLine2 && <p className="mb-0.5">{config.footerLine2}</p>}
            {config.footerLine3 && <p className="mb-0.5">{config.footerLine3}</p>}
            {config.footerLine4 && <p>{config.footerLine4}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/** Wrapper d'impression — identique pour tous les rapports */
export function OfficialReportPrintWrapper({ children }: { children: ReactNode }) {
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
      {children}
    </div>
  );
}
