'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { ContentStatus } from '@angaly/types';

import { Skeleton } from '@/components/ui/skeleton';
import type { CatalogPageEntry } from '../utils/merge-section-catalog';

interface SectionsListProps {
  pages: CatalogPageEntry[];
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
function statusPillClasses(status: ContentStatus | null): string {
  if (status === null) return 'bg-transparent text-angaly-warm-gray border-dashed border-angaly-border';
  return status === ContentStatus.PUBLISHED
    ? 'bg-angaly-success/10 text-angaly-success border-angaly-success/30'
    : 'bg-angaly-slate/10 text-angaly-slate border-angaly-slate/30';
}

function statusLabel(status: ContentStatus | null): string {
  if (status === null) return 'Non créée';
  return status === ContentStatus.PUBLISHED ? 'Publié' : 'Brouillon';
}

export const SectionsList: React.FC<SectionsListProps> = ({ pages, isLoading, selected, onSelect }) => {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (pages.length === 0) {
    return <p className="text-sm text-angaly-slate p-4 font-medium">Aucune section éditable pour l&apos;instant.</p>;
  }

  const totalSections = pages.reduce((acc, p) => acc + p.sections.length, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-angaly-border bg-angaly-ivory/60 flex justify-between items-center sticky top-0 z-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-angaly-navy">Arborescence</h2>
        <span className="text-[11px] text-angaly-slate font-medium">
          {totalSections} sections
        </span>
      </div>

      <nav aria-label="Pages et sections" className="divide-y divide-angaly-border overflow-y-auto">
        {pages.map((group) => (
          <div key={group.page} className="py-2.5">
            <p className="px-4 text-[11px] uppercase tracking-wider text-angaly-navy font-bold mb-1.5">{group.label}</p>
            {group.sections.map((section) => {
              const isActive = selected?.page === group.page && selected.sectionKey === section.sectionKey;
              return (
                <button
                  key={section.sectionKey}
                  type="button"
                  onClick={() => onSelect(group.page, section.sectionKey)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs transition-colors border-l-2 ${
                    isActive
                      ? 'bg-angaly-ivory text-angaly-navy font-semibold border-angaly-gold'
                      : 'text-angaly-slate hover:bg-angaly-ivory/50 hover:text-angaly-navy border-transparent font-medium'
                  }`}
                >
                  <FileText size={14} className={`shrink-0 ${isActive ? 'text-angaly-gold' : 'text-angaly-warm-gray'}`} />
                  <span className="flex-1 truncate">{section.label}</span>
                  <span
                    className={`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-sm border whitespace-nowrap ${statusPillClasses(section.status)}`}
                  >
                    {statusLabel(section.status)}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
};
