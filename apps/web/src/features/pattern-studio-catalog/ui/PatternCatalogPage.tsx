'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { PATTERN_CATALOG_GROUP_LABELS } from '@angaly/types';
import { usePatternCatalog, type CatalogFilter } from '../hooks/usePatternCatalog';
import { CatalogCard } from './CatalogCard';
import { CatalogPiecesDialog } from './CatalogPiecesDialog';

const FILTERS: CatalogFilter[] = ['TOUS', 'MODERNE', 'HISTORIQUE', 'MARIEE'];
const filterLabel = (f: CatalogFilter): string => (f === 'TOUS' ? 'Tous' : PATTERN_CATALOG_GROUP_LABELS[f]);

/** « Catalogue des patrons » — the dresses the pattern engine can make, each from its original inspiration. */
export const PatternCatalogPage = () => {
  const c = usePatternCatalog();
  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-angaly-primary mb-2">Catalogue des patrons</h1>
        <p className="text-sm italic text-angaly-slate">
          {c.counts.TOUS > 0 ? `${c.counts.TOUS} robes` : 'Les robes'} que notre moteur de patronage sait réaliser, chacune
          d’après son modèle d’origine. Le patron est généré à vos mesures.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par époque">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={c.filter === f}
              onClick={() => c.setFilter(f)}
              className={`px-4 py-1.5 rounded-full border text-xs uppercase tracking-wider transition-colors ${
                c.filter === f
                  ? 'bg-angaly-primary text-white border-angaly-primary'
                  : 'bg-white text-angaly-slate border-angaly-border hover:border-angaly-gold/60 hover:text-angaly-primary'
              }`}
            >
              {filterLabel(f)} ({c.counts[f]})
            </button>
          ))}
        </div>
        <label className="relative block md:w-72">
          <span className="sr-only">Rechercher un modèle</span>
          <Search className="w-4 h-4 text-angaly-warm-gray absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            value={c.search}
            onChange={(e) => c.setSearch(e.target.value)}
            placeholder="Rechercher un modèle"
            className="w-full pl-9 pr-3 py-2 rounded border border-angaly-border bg-white text-sm text-angaly-primary placeholder:text-angaly-slate/70 focus:outline-none focus:ring-2 focus:ring-angaly-gold/40"
          />
        </label>
      </div>

      {c.createError && (
        <p role="alert" className="mb-6 text-sm text-red-700">
          Le projet n’a pas pu être créé. Réessayez dans un instant.
        </p>
      )}

      {c.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[30rem] bg-angaly-ivory/60 rounded-xl animate-pulse border border-angaly-border" />
          ))}
        </div>
      ) : c.isError ? (
        <p className="text-sm text-angaly-slate">Le catalogue ne peut pas être chargé pour le moment.</p>
      ) : c.visible.length === 0 ? (
        <p className="text-sm text-angaly-slate">Aucun modèle ne correspond à votre recherche.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {c.visible.map((entry) => (
            <CatalogCard key={entry.id} entry={entry} creating={c.creatingId === entry.id} onCreate={c.createFrom} onShowPieces={c.showPieces} />
          ))}
        </div>
      )}

      {c.openPieces && <CatalogPiecesDialog entry={c.openPieces} onClose={() => c.showPieces(null)} />}

      <p className="text-xs italic text-angaly-slate/70 mt-12 text-center">
        Photos de musées et d’archives sous licence libre (domaine public, CC0, CC BY, CC BY-SA) — crédit sous chaque modèle.
      </p>
    </div>
  );
};
