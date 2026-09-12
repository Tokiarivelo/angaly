import React from 'react';
import Link from 'next/link';
import { ArrowLeft, History } from 'lucide-react';
import { PatternStatus } from '@angaly/types';

interface ProjectStatusHeaderProps {
  projectRef: string;
  status: PatternStatus;
  garmentType: string;
  versionsCount?: number;
  onOpenHistory: () => void;
}

export const ProjectStatusHeader: React.FC<ProjectStatusHeaderProps> = ({
  projectRef,
  status,
  garmentType,
  versionsCount = 1,
  onOpenHistory,
}) => {
  const getStatusBadge = (s: PatternStatus) => {
    switch (s) {
      case PatternStatus.DRAFT:
        return { label: 'Brouillon', color: 'bg-slate-700/60 text-slate-300 border-slate-600/40' };
      case PatternStatus.GENERATING:
        return { label: 'Génération en cours…', color: 'bg-[#3E6D91]/30 text-[#8ec5fc] border-[#3E6D91]' };
      case PatternStatus.GENERATED:
        return { label: 'Généré', color: 'bg-[#3E6D91]/30 text-[#8ec5fc] border-[#3E6D91]' };
      case PatternStatus.REVIEW_REQUIRED:
        return { label: 'À vérifier par Angaly', color: 'bg-[#A47735]/30 text-[#f6cb85] border-[#A47735]' };
      case PatternStatus.CORRECTION_REQUIRED:
        return { label: 'Correction demandée', color: 'bg-[#A64A43]/30 text-[#ff9991] border-[#A64A43]' };
      case PatternStatus.VALIDATED:
        return { label: 'Validé par Angaly', color: 'bg-[#46745A]/30 text-[#8be2b2] border-[#46745A]' };
      case PatternStatus.EXPORTED:
        return { label: 'Exporté', color: 'bg-[#C5B190]/20 text-[#C5B190] border-[#C5B190]/50' };
      case PatternStatus.ARCHIVED:
        return { label: 'Archivé', color: 'bg-gray-800 text-gray-400 border-gray-700' };
      default:
        return { label: s, color: 'bg-gray-800 text-gray-300 border-gray-700' };
    }
  };

  const badge = getStatusBadge(status);

  return (
    <header className="w-full bg-[#041329] border-b border-[#C5B190]/20 py-4 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Link
          href="/pattern-studio"
          className="text-[#D8D3C8] hover:text-[#C5B190] transition-colors p-1.5 rounded-full hover:bg-[#0C2650]"
          aria-label="Retour au studio"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-xl sm:text-2xl text-white font-light tracking-wide">
              Projet {projectRef}
            </h1>
            <span className="text-xs uppercase px-2 py-0.5 rounded bg-[#0C2650] text-[#C5B190] border border-[#C5B190]/30 font-medium">
              {garmentType}
            </span>
          </div>
          <p className="text-xs text-[#D8D3C8]/60 font-light mt-0.5">
            Validation technique & export d’atelier
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status pill badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span>{badge.label}</span>
        </span>

        {/* Versions history trigger */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0C2650] border border-[#C5B190]/30 text-[#D8D3C8] hover:text-white hover:border-[#C5B190] text-xs font-medium transition-colors"
        >
          <History className="w-3.5 h-3.5 text-[#C5B190]" />
          <span>Versions ({versionsCount})</span>
        </button>
      </div>
    </header>
  );
};
