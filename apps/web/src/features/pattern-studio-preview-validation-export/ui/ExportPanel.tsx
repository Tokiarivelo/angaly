'use client';

import React, { useState } from 'react';
import { Download, Check, Lock, FileText, Loader2 } from 'lucide-react';
import { PatternExportFormat, PatternStatus } from '@angaly/types';
import { EXPORT_FORMAT_OPTIONS } from '../consts/export-format-labels.const';
import { useExportPattern } from '../hooks/useExportPattern';

interface ExportPanelProps {
  projectId: string;
  versionId: string;
  status: PatternStatus;
}

const INCLUDED_IN_EXPORT = [
  'Logo et cartouche d’authentification Maison Angaly',
  'Nom du projet et référence unique d’archive',
  'Tableau des mesures corporelles utilisées',
  'Planches vectorielles à échelle exacte 1:1',
  'Tracé des marges de couture et ligne de droit-fil',
  'Repères de montage et crans d’assemblage numérotés',
  'Guide d’impression et d’assemblage pas à pas',
  'Conseils d’entoilage et métrage tissu conseillé',
];

export const ExportPanel: React.FC<ExportPanelProps> = ({
  projectId,
  versionId,
  status,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<PatternExportFormat>(
    PatternExportFormat.PDF_A4,
  );

  const { mutate: exportFile, isPending } = useExportPattern(projectId, versionId);

  // Can only export when VALIDATED or EXPORTED
  const isExportUnlocked =
    status === PatternStatus.VALIDATED || status === PatternStatus.EXPORTED;

  const handleDownload = () => {
    if (isExportUnlocked) {
      exportFile(selectedFormat);
    }
  };

  return (
    <div className="mt-8 bg-[#0C2650] border border-[#C5B190]/30 rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#C5B190]/15">
        <div>
          <h2 className="font-serif text-2xl text-white font-light">
            Exporter votre patron
          </h2>
          <p className="text-xs text-[#D8D3C8]/70 font-light mt-1">
            Sélectionnez votre format d’atelier pour impression immédiate ou table de coupe.
          </p>
        </div>

        {!isExportUnlocked && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#041329] text-[#C5B190] border border-[#C5B190]/30 text-xs font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Export débloqué après validation d’atelier</span>
          </div>
        )}
      </div>

      {/* Format selector cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {EXPORT_FORMAT_OPTIONS.map((opt) => {
          const isSelected = selectedFormat === opt.format;

          return (
            <button
              key={opt.format}
              type="button"
              onClick={() => setSelectedFormat(opt.format)}
              className={`p-4 rounded-xl text-left border transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#041329] border-[#C5B190] ring-1 ring-[#C5B190] shadow-md'
                  : 'bg-[#041329]/60 border-[#C5B190]/20 hover:border-[#C5B190]/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-4 h-4 text-[#C5B190]" />
                  {opt.badge && (
                    <span className="text-[9px] bg-[#936C3E] text-white px-1.5 py-0.5 rounded font-bold uppercase">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-white text-xs font-medium mb-1">{opt.label}</h3>
                <p className="text-[11px] text-[#D8D3C8]/60 font-light leading-snug">
                  {opt.sheetSize}
                </p>
              </div>

              {isSelected && (
                <span className="w-4 h-4 rounded-full bg-[#C5B190] text-[#041329] flex items-center justify-center mt-3 self-end">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Export Checklist Content */}
      <div className="bg-[#041329]/60 border border-[#C5B190]/20 rounded-xl p-5 mb-8">
        <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
          Le document d’export comprend systématiquement :
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#D8D3C8]">
          {INCLUDED_IN_EXPORT.map((item) => (
            <div key={item} className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#C5B190] shrink-0 mt-0.5" />
              <span className="font-light">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Download Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-[#D8D3C8]/60 italic font-light">
          Tous les fichiers sont générés en haute définition vectorielle et certifiés sans mise à l’échelle involontaire.
        </p>

        <button
          type="button"
          onClick={handleDownload}
          disabled={!isExportUnlocked || isPending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded bg-[#936C3E] text-white hover:bg-[#B59A70] text-xs uppercase tracking-wider font-semibold transition-all shadow-xl hover:shadow-[#936C3E]/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Génération du fichier…</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Télécharger l’export ({selectedFormat})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
