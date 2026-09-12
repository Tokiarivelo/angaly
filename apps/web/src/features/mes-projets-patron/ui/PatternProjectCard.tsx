import React from 'react';
import Link from 'next/link';
import { Scissors, Calendar, ArrowRight, History } from 'lucide-react';
import { PatternStatus, type PatternProjectDto } from '@angaly/types';
import { PatternProjectStatusBadge } from './PatternProjectStatusBadge';

interface PatternProjectCardProps {
  project: PatternProjectDto;
  onOpenProject: (project: PatternProjectDto) => void;
}

export const PatternProjectCard: React.FC<PatternProjectCardProps> = ({
  project,
  onOpenProject,
}) => {
  const isDraft =
    project.status === PatternStatus.DRAFT ||
    project.status === ('DRAFT' as PatternStatus);

  const versionsCount = project.versionsCount ?? project.versions?.length ?? 0;
  const updatedDate = new Date(project.updatedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleCardClick = () => {
    onOpenProject(project);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenProject(project);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      aria-label={`Projet ${project.projectRef}`}
      data-testid={`pattern-project-card-${project.id}`}
      className="bg-white rounded-xl border border-angaly-border border-t-2 border-t-angaly-champagne p-6 shadow-sm hover:shadow-md hover:border-angaly-gold/60 transition-all flex flex-col justify-between group cursor-pointer focus:outline-none focus:ring-2 focus:ring-angaly-gold/40 select-none"
    >
      <div>
        {/* Header with thumbnail & ref */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-angaly-ivory text-angaly-primary flex items-center justify-center border border-angaly-champagne/40 group-hover:bg-angaly-champagne/20 group-hover:border-angaly-gold/50 transition-colors">
              <Scissors className="w-5 h-5 text-angaly-gold" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-semibold text-angaly-primary tracking-tight group-hover:text-angaly-gold transition-colors">
                {project.projectRef}
              </h3>
              <p className="text-xs text-angaly-slate font-medium capitalize">
                {project.garmentType.toLowerCase()} {project.style ? `• ${project.style.toLowerCase()}` : ''}
              </p>
            </div>
          </div>

          <PatternProjectStatusBadge status={project.status} />
        </div>

        {/* Info rows */}
        <div className="border-t border-angaly-border/50 pt-3 mb-6 space-y-2 text-xs text-angaly-slate">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-angaly-warm-gray" />
              <span>Dernière modification :</span>
            </span>
            <span className="font-medium text-angaly-primary">{updatedDate}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-angaly-warm-gray" />
              <span>Versions créées :</span>
            </span>
            <span className="font-medium text-angaly-primary">
              {versionsCount > 0 ? `${versionsCount} version(s)` : '0 (ébauche en cours)'}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-angaly-border/50">
        {versionsCount > 0 && !isDraft ? (
          <Link
            href={`/pattern-studio/projects/${project.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-angaly-slate hover:text-angaly-primary transition-colors flex items-center gap-1 self-center"
          >
            <History className="w-3.5 h-3.5 text-angaly-gold" />
            <span>Historique</span>
          </Link>
        ) : (
          <span className="text-xs text-angaly-gold font-medium flex items-center gap-1.5 self-center">
            <span className="w-1.5 h-1.5 rounded-full bg-angaly-gold animate-pulse" />
            Ébauche en cours
          </span>
        )}

        <button
          type="button"
          data-testid="open-project-button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProject(project);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded bg-angaly-primary text-white hover:bg-angaly-primary-dark text-xs uppercase tracking-wider font-semibold transition-colors shadow-sm group-hover:bg-angaly-primary-dark"
        >
          <span>{isDraft ? "Reprendre l'ébauche" : 'Ouvrir le projet'}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
