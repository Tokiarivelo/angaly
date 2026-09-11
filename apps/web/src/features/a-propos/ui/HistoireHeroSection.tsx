import Image from 'next/image';

import type { AProposContent } from '../hooks/useAProposContent';

/** Real Stitch "Notre Histoire" screen: 70vh hero, dark overlay, centered serif title + italic champagne subtitle. */
export function HistoireHeroSection({ content }: { content: AProposContent['hero'] }) {
  return (
    <section className="relative flex h-[70vh] min-h-[500px] w-full items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 bg-angaly-navy">
        {content.imageUrl ? (
          <Image
            src={content.imageUrl}
            alt={content.title}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60 mix-blend-overlay"
          />
        ) : (
          <div aria-hidden="true" className="h-full w-full bg-gradient-to-br from-angaly-royal-navy to-angaly-navy" />
        )}
        <div aria-hidden="true" className="from-angaly-navy/80 absolute inset-0 bg-gradient-to-t to-transparent" />
      </div>
      <div className="relative z-10 px-4 text-center text-white">
        <h1 className="font-heading mb-4 text-5xl tracking-wider md:text-7xl">{content.title}</h1>
        <p className="font-heading mx-auto max-w-2xl text-xl text-angaly-champagne italic md:text-2xl">
          {content.subtitle}
        </p>
      </div>
    </section>
  );
}
