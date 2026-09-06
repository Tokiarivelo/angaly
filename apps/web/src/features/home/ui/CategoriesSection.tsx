import type { HomeContent } from '../hooks/useHomeContent';

/** stitch-prompts/01-home.md "SECTION 4 — CATEGORY CARDS". */
export function CategoriesSection({ content }: { content: HomeContent['categories'] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {content.map((category) => (
          <div
            key={category.label}
            className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-angaly-warm-ivory"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-angaly-soft-navy to-angaly-navy transition-transform duration-500 group-hover:scale-105"
            />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-angaly-navy-dark" />
            <p className="absolute bottom-4 left-4 font-heading text-lg text-white">{category.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
