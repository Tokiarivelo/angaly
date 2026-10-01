'use client';

import React from 'react';
import type { CreationProjectDto, CreationProjectStage } from '@angaly/types';
import { CreationProjectRow } from './CreationProjectRow';
import { EmptyCreationProjectsState } from './EmptyCreationProjectsState';

interface CreationProjectsTableProps {
  projects: CreationProjectDto[];
  totalProjects: number;
  startIndex: number;
  endIndex: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onUpdateStage: (id: string, stage: CreationProjectStage) => Promise<unknown>;
  isUpdating: boolean;
  updatingId?: string | undefined;
}

export const CreationProjectsTable: React.FC<CreationProjectsTableProps> = ({
  projects,
  totalProjects,
  startIndex,
  endIndex,
  currentPage,
  totalPages,
  onPageChange,
  onUpdateStage,
  isUpdating,
  updatingId,
}) => {
  return (
    <div className="bg-white border border-[#D9D4CA] shadow-sm overflow-hidden rounded-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F6F2E9] border-b border-[#D9D4CA] text-[11px] font-headline uppercase tracking-wider text-[#5C697A]">
              <th scope="col" className="py-4 px-6 font-medium">
                Référence
              </th>
              <th scope="col" className="py-4 px-6 font-medium">
                Création
              </th>
              <th scope="col" className="py-4 px-6 font-medium">
                Devis
              </th>
              <th scope="col" className="py-4 px-6 font-medium">
                Ouvert le
              </th>
              <th scope="col" className="py-4 px-6 font-medium">
                Étape
              </th>
              <th scope="col" className="py-4 px-6 font-medium text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9D4CA] text-xs font-body">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-0">
                  <EmptyCreationProjectsState />
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <CreationProjectRow
                  key={project.id}
                  project={project}
                  onUpdateStage={onUpdateStage}
                  isSaving={isUpdating && updatingId === project.id}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer / Pagination */}
      <div className="p-4 bg-[#F6F2E9]/60 border-t border-[#D9D4CA] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5C697A]">
        <p>
          Affichage de{' '}
          <span className="font-bold text-[#061938]">{startIndex}</span> à{' '}
          <span className="font-bold text-[#061938]">{endIndex}</span> sur{' '}
          <span className="font-bold text-[#061938]">{totalProjects}</span> projets
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1 bg-white border border-[#D9D4CA] text-[#061938] font-medium rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
            >
              Précédent
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 font-medium rounded-sm transition-colors ${
                  pageNum === currentPage
                    ? 'bg-[#061938] text-white'
                    : 'bg-white border border-[#D9D4CA] text-[#061938] hover:bg-neutral-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 bg-white border border-[#D9D4CA] text-[#061938] font-medium rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
