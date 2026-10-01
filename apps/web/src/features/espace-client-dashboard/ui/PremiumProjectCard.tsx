import React from 'react';
import Link from 'next/link';
import { Sparkles, Compass, ArrowRight } from 'lucide-react';
import { PatternStatus } from '@angaly/types';

export interface PremiumProjectCardData {
  id: string;
  name: string;
  status: PatternStatus;
}

interface PremiumProjectCardProps {
  project?: PremiumProjectCardData | null;
}

const PATTERN_STATUS_LABELS: Record<PatternStatus, { label: string; badgeClass: string }> = {
  [PatternStatus.DRAFT]: { label: 'Brouillon', badgeClass: 'text-angaly-slate bg-angaly-warm-ivory/30' },
  [PatternStatus.GENERATING]: { label: 'En cours', badgeClass: 'text-angaly-info bg-angaly-info/10' },
  [PatternStatus.GENERATED]: { label: 'À vérifier', badgeClass: 'text-angaly-warning bg-angaly-warning/10' },
  [PatternStatus.REVIEW_REQUIRED]: { label: 'À valider', badgeClass: 'text-angaly-warning bg-angaly-warning/10' },
  [PatternStatus.CORRECTION_REQUIRED]: { label: 'Correction', badgeClass: 'text-angaly-error bg-angaly-error/10' },
  [PatternStatus.VALIDATED]: { label: 'Validé', badgeClass: 'text-angaly-success bg-angaly-success/10' },
  [PatternStatus.EXPORTED]: { label: 'Exporté', badgeClass: 'text-angaly-gold bg-angaly-champagne/20' },
  [PatternStatus.ARCHIVED]: { label: 'Archivé', badgeClass: 'text-angaly-slate bg-angaly-warm-ivory/20' },
};

export const PremiumProjectCard: React.FC<PremiumProjectCardProps> = ({ project }) => {
  if (!project) {
    return (
      <div className="bg-white border border-angaly-border border-t-2 border-t-angaly-champagne p-6 flex flex-col justify-between hover:shadow-sm transition-shadow duration-300 group relative overflow-hidden h-full min-h-[220px]">
        {/* Subtle background compass hint */}
        <div className="absolute -right-3 -top-3 opacity-5 pointer-events-none select-none text-angaly-navy">
          <Compass size={110} strokeWidth={1} />
        </div>

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-angaly-champagne" />
            <span className="text-xs font-heading italic text-angaly-champagne font-medium">Premium</span>
          </div>
          <span className="text-[10px] font-sans tracking-widest uppercase text-angaly-slate bg-angaly-warm-ivory/20 px-2 py-0.5 rounded font-medium">
            Pattern Studio
          </span>
        </div>

        <div className="my-auto relative z-10">
          <h3 className="font-heading text-base text-angaly-navy mb-1 group-hover:text-angaly-gold transition-colors font-medium">
            Studio de patronage
          </h3>
          <p className="text-xs text-angaly-slate leading-relaxed">
            Créez vos patrons de haute couture assistés par notre studio géométrique.
          </p>
        </div>

        <Link
          href="/pattern-studio"
          className="mt-4 pt-3 border-t border-angaly-border/50 text-xs font-sans tracking-wider uppercase text-angaly-soft-navy hover:text-angaly-navy flex items-center justify-end gap-1 font-medium transition-colors relative z-10"
        >
          <span>Créer un patron</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  const statusInfo = PATTERN_STATUS_LABELS[project.status] ?? {
    label: 'En cours',
    badgeClass: 'text-angaly-warning bg-angaly-warning/10',
  };

  return (
    <div className="bg-white border border-angaly-border border-t-2 border-t-angaly-champagne p-6 flex flex-col justify-between hover:shadow-sm transition-shadow duration-300 group relative overflow-hidden h-full min-h-[220px]">
      {/* Subtle background compass watermark */}
      <div className="absolute -right-3 -top-3 opacity-5 pointer-events-none select-none text-angaly-navy">
        <Compass size={110} strokeWidth={1} />
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-angaly-champagne" />
          <span className="text-xs font-heading italic text-angaly-champagne font-medium">Premium</span>
        </div>
        <span className={`text-[10px] font-sans tracking-widest uppercase px-2 py-0.5 rounded font-medium ${statusInfo.badgeClass}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="my-auto relative z-10">
        <p className="text-[11px] text-angaly-warm-gray mb-1 font-mono">
          Réf: {project.id.length > 18 ? `${project.id.slice(0, 18)}...` : project.id}
        </p>
        <h3 className="font-heading text-lg text-angaly-navy group-hover:text-angaly-gold transition-colors font-medium">
          {project.name || 'Patron Sur-Mesure'}
        </h3>
      </div>

      <Link
        href="/pattern-studio"
        className="mt-4 pt-3 border-t border-angaly-border/50 text-xs font-sans tracking-wider uppercase text-angaly-soft-navy hover:text-angaly-navy flex items-center justify-end gap-1 font-medium transition-colors relative z-10"
      >
        <span>Voir détails</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  );
};
