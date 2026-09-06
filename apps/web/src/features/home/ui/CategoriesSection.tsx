import Link from 'next/link';

import type { HomeContent } from '../hooks/useHomeContent';

/** stitch-prompts/01-home.md "SECTION 4 — CATEGORY CARDS", "Univers" headline + 4-tile grid. */
export function CategoriesSection({ content }: { content: HomeContent['categories'] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <h2 className="font-heading text-4xl text-angaly-navy">{content.headline}</h2>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {content.items.map((category) => (
          <Link
            key={category.label}
            href={category.href}
            className="group relative aspect-[3/4] overflow-hidden bg-angaly-warm-ivory"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-angaly-soft-navy to-angaly-navy transition-transform duration-500 group-hover:scale-105"
            />
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/50" />
            <p className="font-heading absolute inset-x-0 top-8 text-center text-lg tracking-[0.2em] text-white uppercase">
              {category.label}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
