import React from 'react';
import Link from 'next/link';
import { Sparkles, Layers } from 'lucide-react';
import { PatternStatus } from '@angaly/types';

export interface PremiumProjectCardData {
  id: string;
  name: string;
  status: PatternStatus;
}

interface PremiumProjectCardProps {
  project?: PremiumProjectCardData | null;
}

const PATTERN_STATUS_LABELS: Partial<Record<PatternStatus, string>> = {
  [PatternStatus.GENERATING]: 'Génération en cours',
  [PatternStatus.GENERATED]: 'Patron généré — à valider',
  [PatternStatus.REVIEW_REQUIRED]: 'En attente de votre validation',
  [PatternStatus.CORRECTION_REQUIRED]: 'Correction requise',
};

export const PremiumProjectCard: React.FC<PremiumProjectCardProps> = ({ project }) => {
  if (!project) return null;

  return (
    <div className="bg-[#FAF8F5] p-6 rounded-2xl border-2 border-[#C5B190] h-full flex flex-col relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -right-12 -top-12 opacity-10">
        <Sparkles size={120} className="text-[#C5B190]" />
      </div>

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#C5B190] shadow-sm">
          <Layers size={20} />
        </div>
        <div>
          <h2 className="font-serif text-lg text-primary-deep-navy">Pattern Studio</h2>
          <p className="text-xs text-[#C5B190] font-medium tracking-wide uppercase">Création Premium</p>
        </div>
      </div>

      <div className="flex-1 relative z-10">
        <h3 className="font-medium text-primary-deep-navy text-lg mb-2">{project.name}</h3>
        <p className="text-sm text-slate mb-4">
          {PATTERN_STATUS_LABELS[project.status] ?? 'Votre projet est en cours de modélisation par notre moteur AI.'}
        </p>
      </div>

      <Link href="/pattern-studio" className="mt-6 text-sm font-medium text-primary-deep-navy hover:underline underline-offset-4 relative z-10">
        Reprendre le projet &rarr;
      </Link>
    </div>
  );
};
