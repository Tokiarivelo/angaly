import { Sparkles } from 'lucide-react';
import Image from 'next/image';

import type { AProposContent } from '../hooks/useAProposContent';

/** Real Stitch screen's "L'Atelier": 4-col grid, first tile spans 2x2, one tile is icon-only ("Matières Nobles"). */
export function AtelierGallerySection({ content }: { content: AProposContent['atelier'] }) {
  return (
    <section className="bg-angaly-ivory px-2 py-24 md:px-6">
      <div className="mx-auto max-w-screen-2xl">
        <div className="mb-16 text-center">
          <h2 className="font-heading mb-2 text-4xl tracking-wide text-angaly-navy md:text-5xl">{content.title}</h2>
          <p className="text-sm font-light tracking-widest text-angaly-slate uppercase">{content.subtitle}</p>
        </div>
        <div className="grid auto-rows-[160px] grid-cols-2 gap-4 md:auto-rows-[240px] md:grid-cols-4">
          {content.items.map((item, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden ${
                item.size === 'large'
                  ? 'col-span-2 row-span-2 min-h-[376px] md:min-h-[496px]'
                  : 'min-h-[180px] md:min-h-[240px]'
              } ${index === 3 ? 'col-span-2 md:col-span-1' : ''}`}
            >
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.label ?? `Atelier de création ANGALY — vue ${index + 1}`}
                  fill
                  sizes={item.size === 'large' ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 25vw, 50vw'}
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              ) : (
                <div className="bg-angaly-warm-ivory flex h-full w-full flex-col items-center justify-center p-8 text-center">
                  <Sparkles className="text-angaly-navy mb-4 h-9 w-9" strokeWidth={1} aria-hidden="true" />
                  <h4 className="font-heading text-xl text-angaly-navy">{item.label}</h4>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
