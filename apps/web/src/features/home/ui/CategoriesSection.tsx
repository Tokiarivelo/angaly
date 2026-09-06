import Link from 'next/link';

import type { HomeContent } from '../hooks/useHomeContent';

/**
 * stitch-prompts/01-home.md "SECTION 4 — CATEGORY CARDS" / real mockup
 * "Univers" — a horizontal snap-scroll carousel, not a static grid.
 */
export function CategoriesSection({ content }: { content: HomeContent['categories'] }) {
  return (
    <section className="overflow-hidden py-24">
      <div className="mx-auto mb-12 max-w-7xl px-6 md:px-16">
        <h2 className="font-heading text-4xl tracking-wide text-angaly-navy">{content.headline}</h2>
      </div>

      <div className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-8 [scrollbar-width:none] md:px-16 [&::-webkit-scrollbar]:hidden">
        {content.items.map((category) => (
          <Link
            key={category.label}
            href={category.href}
            className="group relative h-[500px] w-72 flex-none snap-start overflow-hidden md:w-96"
          >
            <div
              aria-hidden="true"
              className="h-full w-full bg-gradient-to-br from-angaly-soft-navy to-angaly-navy transition-transform duration-700 group-hover:scale-105"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-angaly-navy/20 transition-colors duration-300 group-hover:bg-angaly-navy/40"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <h3 className="font-heading text-3xl tracking-widest text-white uppercase">{category.label}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
