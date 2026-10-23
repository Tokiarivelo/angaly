'use client';

import React, { useState } from 'react';
import { ArrowRight, ImageOff, Layers, Loader2, Ruler } from 'lucide-react';
import type { PatternCatalogEntryDto } from '@angaly/types';

interface CatalogCardProps {
  entry: PatternCatalogEntryDto;
  creating: boolean;
  onCreate: (id: string) => void;
  onShowPieces: (id: string) => void;
}

const metres = (m: number | null): string | null => (m === null ? null : `${m.toFixed(2).replace('.', ',')} m`);

/** One dress of the catalogue: its inspiration photo, period, name, what it is made of, and how to start from it. */
export const CatalogCard: React.FC<CatalogCardProps> = ({ entry, creating, onCreate, onShowPieces }) => {
  const [failed, setFailed] = useState(false);
  const yardage = metres(entry.yardageM);
  return (
    <article
      data-testid={`catalog-card-${entry.id}`}
      className="bg-white rounded-xl border border-angaly-border border-t-2 border-t-angaly-champagne shadow-sm hover:shadow-md hover:border-angaly-gold/60 transition-all flex flex-col overflow-hidden"
    >
      <div className="relative aspect-[4/5] bg-angaly-ivory">
        {entry.imageUrl && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element -- MinIO URLs: arbitrary host, no optimizer.
          <img
            src={entry.imageUrl}
            alt={`Inspiration : ${entry.credit?.title ?? entry.title}`}
            loading="lazy"
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#5C697A] text-xs">
            <ImageOff className="h-6 w-6 text-angaly-gold" aria-hidden="true" />
            Photo d’inspiration à venir
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col gap-3 flex-1">
        <p className="text-[11px] uppercase tracking-widest text-angaly-gold font-semibold">{entry.era}</p>
        <h3 className="font-serif text-xl text-[#061938] leading-snug">{entry.title}</h3>
        <p className="text-sm text-[#5C697A] line-clamp-2">{entry.notes}</p>
        <div className="flex items-center gap-4 text-xs text-[#5C697A]">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-angaly-warm-gray" aria-hidden="true" />
            <span className="font-medium text-[#061938]">{entry.pieceCount} pièces</span>
          </span>
          {yardage && (
            <span className="flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-angaly-warm-gray" aria-hidden="true" />
              <span className="font-medium text-[#061938]">{yardage}</span>
            </span>
          )}
        </div>
        {entry.credit && (
          <p className="text-[11px] text-[#5C697A]/80">
            Photo :{' '}
            <a href={entry.credit.page} target="_blank" rel="noreferrer" className="underline hover:text-[#061938]">
              {entry.credit.source}
            </a>
            {entry.credit.date ? `, ${entry.credit.date}` : ''} — {entry.credit.license}
          </p>
        )}
        <div className="mt-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-angaly-border/50">
          <button
            type="button"
            onClick={() => onShowPieces(entry.id)}
            className="text-xs text-[#5C697A] hover:text-[#061938] transition-colors self-center underline-offset-2 hover:underline"
          >
            Voir les pièces
          </button>
          <button
            type="button"
            onClick={() => onCreate(entry.id)}
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded bg-angaly-gold text-white hover:bg-angaly-gold-dark text-xs uppercase tracking-wider font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : null}
            <span>{creating ? 'Création…' : 'Créer ce patron'}</span>
            {!creating && <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </article>
  );
};
