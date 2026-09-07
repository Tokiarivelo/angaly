import Image from 'next/image';

import type { AProposContent } from '../hooks/useAProposContent';

/** Real Stitch screen's "Qui est Angaly ?": text left, portrait right with a decorative offset frame. */
export function FondatriceSection({ content }: { content: AProposContent['fondatrice'] }) {
  return (
    <section className="bg-angaly-warm-ivory/30 px-6 py-24 md:px-12 lg:px-24">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 lg:flex-row">
        <div className="order-2 w-full space-y-6 lg:order-1 lg:w-1/2">
          <h2 className="font-heading text-4xl tracking-wide text-angaly-navy md:text-5xl">{content.title}</h2>
          <h3 className="font-heading text-angaly-champagne text-2xl italic">{content.subtitle}</h3>
          <p className="font-light leading-relaxed text-angaly-slate">{content.paragraph}</p>
          <blockquote className="border-angaly-champagne my-8 border-l-2 py-2 pl-6">
            <p className="font-heading text-2xl leading-snug text-angaly-navy italic">&ldquo;{content.quote}&rdquo;</p>
          </blockquote>
        </div>
        <div className="relative order-1 w-full lg:order-2 lg:w-1/2">
          <div aria-hidden="true" className="border-angaly-champagne/40 pointer-events-none absolute -inset-4 z-0 translate-x-2 translate-y-2 border" />
          {content.imageUrl ? (
            <div className="relative z-10 aspect-[4/5] w-full shadow-md">
              <Image src={content.imageUrl} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="relative z-10 aspect-[4/5] w-full bg-gradient-to-br from-angaly-soft-navy to-angaly-navy shadow-md"
            />
          )}
        </div>
      </div>
    </section>
  );
}
