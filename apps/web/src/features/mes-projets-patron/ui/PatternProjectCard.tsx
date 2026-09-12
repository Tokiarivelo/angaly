import React from 'react';
import Link from 'next/link';
import { Scissors, Calendar, ArrowRight, History } from 'lucide-react';
import type { PatternProjectDto } from '@angaly/types';
import { PatternProjectStatusBadge } from './PatternProjectStatusBadge';

interface PatternProjectCardProps {
  project: PatternProjectDto;
  onOpenProject: (project: PatternProjectDto) => void;
}

export const PatternProjectCard: React.FC<PatternProjectCardProps> = ({
  project,
  onOpenProject,
}) => {
  const versionsCount = project.versionsCount ?? project.versions?.length ?? 1;
  const updatedDate = new Date(project.updatedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl border border-angaly-border border-t-2 border-t-angaly-champagne p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Header with thumbnail & ref */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-angaly-ivory text-angaly-primary flex items-center justify-center border border-angaly-champagne/40 group-hover:bg-angaly-champagne/20 transition-colors">
              <Scissors className="w-5 h-5 text-angaly-gold" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-semibold text-angaly-primary tracking-tight">
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
            <span className="font-medium text-angaly-primary">{versionsCount} version(s)</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-angaly-border/50">
        <Link
          href={`/pattern-studio/projects/${project.id}`}
          className="text-xs text-angaly-slate hover:text-angaly-primary transition-colors flex items-center gap-1 self-center"
        >
          <History className="w-3.5 h-3.5 text-angaly-gold" />
          <span>Historique</span>
        </Link>

        <button
          type="button"
          onClick={() => onOpenProject(project)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded bg-angaly-primary text-white hover:bg-angaly-primary-dark text-xs uppercase tracking-wider font-semibold transition-colors shadow-sm"
        >
          <span>Ouvrir le projet</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
