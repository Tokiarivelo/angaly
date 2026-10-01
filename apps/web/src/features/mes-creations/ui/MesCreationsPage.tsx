'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import { useCreationProjects } from '../hooks/useCreationProjects';
import { useCreationProjectsFilter, type CreationProjectFilter } from '../hooks/useCreationProjectsFilter';
import { CreationProjectCard } from './CreationProjectCard';
import { EmptyCreationProjectsState } from './EmptyCreationProjectsState';

const FILTERS: { id: CreationProjectFilter; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'in-progress', label: 'En cours' },
  { id: 'done', label: 'Livrées' },
];

export function MesCreationsPage() {
  const { data: projects = [], isLoading, isError } = useCreationProjects();
  const { filter, setFilter, counts, visibleProjects } = useCreationProjectsFilter(projects);

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-12">
      <div className="flex flex-col justify-between gap-6 border-b border-angaly-border pb-10 md:flex-row md:items-end">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-angaly-gold">Espace client · Sur-mesure</span>
          <h1 className="mt-2 font-serif text-4xl font-normal tracking-tight text-angaly-navy lg:text-5xl">Mes créations</h1>
          <p className="mt-2 max-w-xl text-sm font-light text-angaly-slate">
            Suivez l&apos;avancement de vos pièces sur mesure, de la consultation à l&apos;essayage final dans nos salons privés.
          </p>
        </div>
        <Link
          href={ROUTES.demandeSurMesure}
          className="inline-flex items-center gap-2 rounded bg-angaly-navy px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-angaly-navy-blue"
        >
          <Plus className="h-4 w-4 text-angaly-champagne" />
          Nouvelle demande sur-mesure
        </Link>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-angaly-slate" role="status">Chargement de vos créations…</p>
      ) : isError ? (
        <p className="py-12 text-center text-sm text-angaly-error" role="alert">Impossible de charger vos créations pour le moment.</p>
      ) : projects.length === 0 ? (
        <EmptyCreationProjectsState />
      ) : (
        <>
          <div className="flex items-center gap-2 py-6" role="tablist" aria-label="Filtrer mes créations">
            {FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={filter === id}
                onClick={() => setFilter(id)}
                className={
                  filter === id
                    ? 'rounded bg-angaly-navy px-4 py-1.5 text-xs font-medium tracking-wide text-white'
                    : 'rounded border border-angaly-border bg-white/70 px-4 py-1.5 text-xs font-medium tracking-wide text-angaly-slate transition-colors hover:bg-white hover:text-angaly-navy'
                }
              >
                {label} ({counts[id]})
              </button>
            ))}
          </div>
          <div className="mt-2 space-y-8">
            {visibleProjects.map((project) => (
              <CreationProjectCard key={project.id} project={project} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
