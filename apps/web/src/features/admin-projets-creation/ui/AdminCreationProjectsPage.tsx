'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import { useAdminCreationProjects } from '../hooks/useAdminCreationProjects';
import { useAdminCreationProjectsFilter } from '../hooks/useAdminCreationProjectsFilter';
import { CreationProjectsFilterChips } from './CreationProjectsFilterChips';
import { CreationProjectsTable } from './CreationProjectsTable';

export const AdminCreationProjectsPage: React.FC = () => {
  const {
    projects,
    isLoading,
    isError,
    error,
    refetch,
    updateStage,
    isUpdating,
    updatingVariables,
  } = useAdminCreationProjects();

  const {
    activeFilter,
    setActiveFilter,
    counts,
    paginatedProjects,
    currentPage,
    setCurrentPage,
    totalPages,
    totalProjects,
    startIndex,
    endIndex,
  } = useAdminCreationProjectsFilter(projects);

  return (
    <div className="flex-1 p-6 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal text-[#061938] tracking-tight mb-2">
            Projets de création
          </h1>
          <p className="text-[#5C697A] text-sm md:text-base font-light">
            Suivez et faites avancer les créations sur mesure des clientes.
          </p>
        </div>
        <div>
          <Link
            href={ROUTES.demandeSurMesure}
            className="bg-[#061938] text-white px-5 py-2.5 font-headline uppercase text-xs tracking-widest hover:bg-[#0C2650] transition-colors inline-flex items-center gap-2 shadow-sm rounded-sm"
          >
            <Plus size={16} />
            Nouveau Projet Sur Mesure
          </Link>
        </div>
      </header>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Chargement des projets">
          <div className="flex gap-2 pb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-24 bg-[#D8D3C8]/40 rounded-sm" />
            ))}
          </div>
          <div className="bg-white border border-[#D9D4CA] h-72 rounded-sm" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0 text-red-600" />
            <p className="text-sm">
              Une erreur est survenue lors du chargement des projets de création :{' '}
              {error instanceof Error ? error.message : 'Erreur inconnue'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="px-4 py-2 bg-red-600 text-white text-xs uppercase tracking-wider font-semibold rounded-sm hover:bg-red-700 transition-colors inline-flex items-center gap-2 shrink-0"
          >
            <RefreshCw size={14} />
            Réessayer
          </button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !isError && (
        <>
          {/* Filter Chips */}
          <CreationProjectsFilterChips
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={counts}
          />

          {/* Main Data Table */}
          <CreationProjectsTable
            projects={paginatedProjects}
            totalProjects={totalProjects}
            startIndex={startIndex}
            endIndex={endIndex}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onUpdateStage={(id, stage) => updateStage({ id, stage })}
            isUpdating={isUpdating}
            updatingId={updatingVariables?.id}
          />
        </>
      )}
    </div>
  );
};
