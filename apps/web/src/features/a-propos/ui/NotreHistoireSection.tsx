import Image from 'next/image';

import type { AProposContent } from '../hooks/useAProposContent';

/** Real Stitch screen's "Comment tout a commencé": photo + récit, then a vertical chronology timeline. */
export function NotreHistoireSection({ content }: { content: AProposContent['histoire'] }) {
  return (
    <section className="bg-angaly-ivory px-6 py-24 md:px-12 lg:px-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div className="relative">
          {content.imageUrl ? (
            <div className="relative aspect-[4/5] w-full border border-angaly-warm-ivory bg-white p-2 shadow-lg">
              <Image src={content.imageUrl} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="aspect-[4/5] w-full border border-angaly-warm-ivory bg-gradient-to-br from-angaly-champagne to-angaly-gold-light p-2 shadow-lg"
            />
          )}
        </div>
        <div className="space-y-8">
          <h2 className="font-heading text-4xl tracking-wide text-angaly-navy md:text-5xl">{content.title}</h2>
          {content.paragraphs.map((paragraph, index) => (
            <p key={index} className="font-light leading-relaxed text-angaly-slate">
              {paragraph}
            </p>
          ))}

          <ol className="border-angaly-warm-ivory relative mt-12 space-y-6 border-l-2 pl-8">
            {content.chronology.map((item) => (
              <li key={item.year} className="relative">
                <span
                  aria-hidden="true"
                  className="border-angaly-champagne bg-angaly-ivory absolute top-1 -left-[41px] flex h-5 w-5 items-center justify-center rounded-full border-2"
                >
                  <span className="bg-angaly-champagne h-1.5 w-1.5 rounded-full" />
                </span>
                <div className="border-angaly-warm-ivory rounded border bg-white p-4 shadow-sm">
                  <time className="font-heading text-angaly-champagne text-lg italic">{item.year}</time>
                  <h3 className="font-heading mt-1 text-xl text-angaly-navy">{item.title}</h3>
                  <p className="mt-2 text-sm font-light text-angaly-slate">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
