'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { ContentStatus } from '@angaly/types';

import type { PageSectionGroupDto } from '../api/page-sections.api';

interface SectionsListProps {
  groups: PageSectionGroupDto[];
  isLoading: boolean;
  selected: { page: string; sectionKey: string } | null;
  onSelect: (page: string, sectionKey: string) => void;
}

/**
 * Status pill only distinguishes Publié/Brouillon — the Stitch prompt also
 * describes a third "Modifications non publiées" state, but `PageSection`
 * (schema.prisma) carries a single `ContentStatus` per locale row with no
 * separate draft/live copy, so that 3-way distinction cannot be represented
 * without a schema change (out of scope for this pass, see
 * docs/features/content.md).
 */
function statusPillClasses(status: ContentStatus): string {
  return status === ContentStatus.PUBLISHED
    ? 'bg-green-50 text-green-700 border-green-200'
    : 'bg-slate-50 text-slate-700 border-slate-200';
}

function statusLabel(status: ContentStatus): string {
  return status === ContentStatus.PUBLISHED ? 'Publié' : 'Brouillon';
}

export const SectionsList: React.FC<SectionsListProps> = ({ groups, isLoading, selected, onSelect }) => {
  if (isLoading) {
    return <p className="text-sm text-slate p-4">Chargement des pages…</p>;
  }

  if (groups.length === 0) {
    return <p className="text-sm text-slate p-4">Aucune section éditable pour l&apos;instant.</p>;
  }

  return (
    <nav aria-label="Pages et sections" className="divide-y divide-border">
      {groups.map((group) => (
        <div key={group.page} className="py-3">
          <p className="px-4 text-xs uppercase tracking-wider text-slate font-semibold mb-1">{group.page}</p>
          {group.sections.map((section) => {
            const isActive = selected?.page === group.page && selected.sectionKey === section.sectionKey;
            return (
              <button
                key={section.sectionKey}
                type="button"
                onClick={() => onSelect(group.page, section.sectionKey)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  isActive ? 'bg-primary-deep-navy/5 text-primary-deep-navy font-medium' : 'text-slate hover:bg-ivory-warm'
                }`}
              >
                <FileText size={16} className="shrink-0" />
                <span className="flex-1 truncate">{section.sectionKey}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap ${statusPillClasses(section.status)}`}
                >
                  {statusLabel(section.status)}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
};
