'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import { formatDate } from '@/lib/utils';
import { useAdminCreationProject } from '../hooks/useAdminCreationProject';
import {
  ADMIN_CREATION_STAGE_BADGE_CLASSES,
  ADMIN_CREATION_STAGE_LABELS,
} from '../consts/stage-config.const';
import { CreationProjectAssigneeCard } from './CreationProjectAssigneeCard';
import { CreationProjectHistory } from './CreationProjectHistory';
import { CreationProjectStageCard } from './CreationProjectStageCard';
import { CreationProjectStepper } from './CreationProjectStepper';

interface AdminCreationProjectDetailPageProps {
  projectId: string;
}

const DATE_OPTIONS = { day: 'numeric', month: 'long', year: 'numeric' } as const;

export const AdminCreationProjectDetailPage: React.FC<AdminCreationProjectDetailPageProps> = ({ projectId }) => {
  const {
    project,
    isLoading,
    isError,
    error,
    refetch,
    assignees,
    updateStage,
    isUpdatingStage,
    assign,
    isAssigning,
  } = useAdminCreationProject(projectId);

  return (
    <div className="flex-1 p-6 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
      <nav aria-label="Fil d'Ariane" className="mb-6 text-xs text-[#5C697A] flex items-center gap-1">
        <Link href={ROUTES.adminCreationProjects} className="inline-flex items-center gap-1 hover:text-[#936C3E]">
          <ChevronLeft size={14} aria-hidden="true" />
          Projets de création
        </Link>
        {project && <span>/ {project.reference}</span>}
      </nav>

      {isLoading && (
        <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Chargement du projet">
          <div className="h-10 w-1/2 bg-[#D8D3C8]/40 rounded-sm" />
          <div className="h-64 bg-white border border-[#D9D4CA] rounded-sm" />
        </div>
      )}

      {isError && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm">{error instanceof Error ? error.message : 'Projet introuvable.'}</p>
          </div>
          <button type="button" onClick={() => void refetch()} className="text-xs uppercase tracking-wider underline">
            Réessayer
          </button>
        </div>
      )}

      {project && (
        <>
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-[#5C697A] mb-2">{project.reference}</p>
              <h1 className="font-serif text-3xl md:text-4xl font-normal text-[#061938] tracking-tight">
                {project.title}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`inline-flex items-center px-2.5 py-1 text-[10px] font-headline uppercase tracking-wider font-semibold border ${ADMIN_CREATION_STAGE_BADGE_CLASSES[project.stage]}`}
              >
                {ADMIN_CREATION_STAGE_LABELS[project.stage]}
              </span>
              {project.quoteNumber && (
                <Link
                  href={`/devis/${project.quoteNumber}`}
                  target="_blank"
                  className="text-xs text-[#061938] underline decoration-dotted underline-offset-2 hover:text-[#936C3E]"
                >
                  Voir le devis
                </Link>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-white border border-[#D9D4CA] rounded-sm p-6">
                <CreationProjectStepper currentStage={project.stage} />
              </section>

              <section className="bg-white border border-[#D9D4CA] rounded-sm p-6 space-y-3">
                <h2 className="font-headline uppercase text-xs tracking-widest text-[#5C697A]">Informations</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <dt className="text-[11px] text-[#8A877F]">Cliente</dt>
                    <dd className="text-[#061938]">{project.customerName ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-[#8A877F]">Ouvert le</dt>
                    <dd className="text-[#061938]">{formatDate(project.createdAt, DATE_OPTIONS)}</dd>
                  </div>
                  {project.completedAt && (
                    <div>
                      <dt className="text-[11px] text-[#8A877F]">Terminé le</dt>
                      <dd className="text-[#061938]">{formatDate(project.completedAt, DATE_OPTIONS)}</dd>
                    </div>
                  )}
                  {project.description && (
                    <div className="sm:col-span-2">
                      <dt className="text-[11px] text-[#8A877F]">Description</dt>
                      <dd className="text-[#061938] whitespace-pre-line">{project.description}</dd>
                    </div>
                  )}
                </dl>
              </section>

              <section className="bg-white border border-[#D9D4CA] rounded-sm p-6 space-y-4">
                <h2 className="font-headline uppercase text-xs tracking-widest text-[#5C697A]">
                  Historique des étapes
                </h2>
                <CreationProjectHistory events={project.stageHistory} />
              </section>
            </div>

            <aside className="space-y-6">
              <CreationProjectAssigneeCard
                key={project.assignedTo?.id ?? 'none'}
                current={project.assignedTo}
                assignees={assignees}
                isSaving={isAssigning}
                onAssign={assign}
              />
              <CreationProjectStageCard
                key={project.stage}
                stage={project.stage}
                isSaving={isUpdatingStage}
                onUpdateStage={updateStage}
              />
            </aside>
          </div>
        </>
      )}
    </div>
  );
};
