import type { AteliersListeContent } from '../hooks/useAteliersListeContent';

/** Real Stitch "Nos Ateliers (Workshops & Locations)" screen: centered header, no breadcrumb (real content — see hooks/useAteliersListeContent.ts). */
export function AteliersHeader({ content }: { content: AteliersListeContent['header'] }) {
  return (
    <header className="w-full border-b border-angaly-border bg-angaly-ivory px-8 py-16 text-center">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="font-heading text-5xl tracking-wide text-angaly-navy md:text-6xl">{content.title}</h1>
        <p className="mx-auto max-w-xl text-lg font-light text-angaly-slate">{content.subtitle}</p>
      </div>
    </header>
  );
}
