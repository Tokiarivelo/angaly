'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { SearchResultDto } from '@angaly/types';

import { useGlobalSearch } from '@/features/navigation/hooks/useGlobalSearch';
import { useMobileSearchOverlay } from '@/features/navigation/hooks/useMobileSearchOverlay';
import { MIN_SEARCH_QUERY_LENGTH } from '@/features/navigation/consts/search.const';
import { SEARCH_SUGGESTION_CHIPS } from '@/features/navigation/consts/search-suggestion-chips.const';
import { ROUTES } from '@/lib/routes';

const RESULT_GROUPS: {
  key: 'creations' | 'products' | 'collections' | 'blogPosts' | 'ateliers';
  label: string;
  hrefPrefix: string;
  seeAllHref: string;
}[] = [
  { key: 'creations', label: 'Créations', hrefPrefix: '/creations', seeAllHref: ROUTES.creations },
  { key: 'products', label: 'Produits', hrefPrefix: '/pret-a-porter', seeAllHref: ROUTES.pretAPorter },
  { key: 'collections', label: 'Collections', hrefPrefix: '/collections', seeAllHref: ROUTES.collections },
  { key: 'blogPosts', label: 'Articles', hrefPrefix: '/journal', seeAllHref: ROUTES.journal },
  { key: 'ateliers', label: 'Ateliers', hrefPrefix: '/ateliers', seeAllHref: ROUTES.ateliers },
];

function ResultRow({ result, close, hrefPrefix }: { result: SearchResultDto; close: () => void; hrefPrefix: string }) {
  return (
    <li>
      <Link
        href={`${hrefPrefix}/${result.slug}`}
        onClick={close}
        className="group -ml-2 flex items-center gap-5 rounded p-2 transition-colors duration-300 hover:bg-angaly-warm-ivory/30"
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-angaly-warm-ivory">
          {result.imageUrl && (
            <Image src={result.imageUrl} alt="" fill sizes="64px" className="object-cover" />
          )}
        </div>
        <div className="flex flex-col justify-center">
          <h4 className="font-heading text-lg text-angaly-navy">{result.title}</h4>
          <p className="text-sm font-light text-angaly-slate">{result.excerpt}</p>
        </div>
        <ArrowRight
          className="ml-auto h-4 w-4 -translate-x-2 text-angaly-warm-gray opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-angaly-navy group-hover:opacity-100"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

/** Real Stitch "Recherche (Overlay)" screen: full-screen, debounced, results grouped by type. */
export function MobileSearchOverlay() {
  const { isOpen, close, query, setQuery, debouncedQuery } = useMobileSearchOverlay();
  const { results, isLoading, hasResults } = useGlobalSearch(debouncedQuery);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col bg-angaly-ivory"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Recherche</Dialog.Title>
          <header className="flex shrink-0 flex-col border-b border-angaly-border/60 px-6 pt-12 pb-6">
            <div className="mb-8 flex items-center justify-between">
              <span className="font-heading text-sm font-bold tracking-[0.3em] text-angaly-navy uppercase">Recherche</span>
              <Dialog.Close asChild>
                <button type="button" aria-label="Fermer la recherche" className="-mr-2 p-2 text-angaly-navy transition-opacity hover:opacity-70">
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </Dialog.Close>
            </div>
            <div className="group relative w-full">
              <Search
                className="pointer-events-none absolute top-1/2 left-0 h-5 w-5 -translate-y-1/2 text-angaly-warm-gray transition-colors group-focus-within:text-angaly-navy"
                aria-hidden="true"
              />
              <label htmlFor="mobile-search-input" className="sr-only">
                Rechercher
              </label>
              <input
                id="mobile-search-input"
                autoFocus
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une création, un produit, un article..."
                className="font-heading h-14 w-full border-0 border-b border-angaly-border bg-transparent py-3 pr-4 pl-8 text-xl text-angaly-navy placeholder:text-angaly-warm-gray/70 placeholder:italic focus:border-angaly-navy focus:ring-0 sm:h-16 sm:text-2xl"
              />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-8">
            <section className="mb-12">
              <h3 className="font-label mb-4 text-[10px] tracking-widest text-angaly-slate uppercase">Suggestions</h3>
              <div className="flex flex-wrap gap-3">
                {SEARCH_SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setQuery(chip)}
                    className="rounded border border-angaly-border bg-transparent px-5 py-2.5 text-sm font-medium text-angaly-navy transition-colors duration-300 hover:bg-angaly-navy hover:text-white"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </section>

            {debouncedQuery.trim().length < MIN_SEARCH_QUERY_LENGTH ? (
              <p className="text-sm text-angaly-slate">Saisissez au moins {MIN_SEARCH_QUERY_LENGTH} caractères pour lancer la recherche.</p>
            ) : isLoading ? (
              <p className="text-sm text-angaly-slate">Recherche en cours…</p>
            ) : !hasResults ? (
              <p className="text-sm text-angaly-slate">Aucun résultat pour « {debouncedQuery} ».</p>
            ) : (
              <div className="space-y-12">
                {RESULT_GROUPS.filter((group) => results[group.key].length > 0).map((group) => (
                  <section key={group.key}>
                    <div className="mb-6 flex items-center justify-between border-b border-angaly-border/40 pb-2">
                      <h2 className="font-heading text-2xl tracking-tight text-angaly-navy italic">{group.label}</h2>
                      <Link
                        href={group.seeAllHref}
                        onClick={close}
                        className="font-label text-xs tracking-widest text-angaly-slate uppercase transition-colors hover:text-angaly-navy"
                      >
                        Voir tout
                      </Link>
                    </div>
                    <ul className="space-y-5">
                      {results[group.key].map((result) => (
                        <ResultRow key={result.id} result={result} close={close} hrefPrefix={group.hrefPrefix} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </main>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
