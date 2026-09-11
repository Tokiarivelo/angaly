import { PenLine, Scissors } from 'lucide-react';
import Image from 'next/image';

import type { AProposContent } from '../hooks/useAProposContent';

const ICONS = { draw: PenLine, cut: Scissors };

/** Real Stitch screen's 4-col grid: 2 tiles have real photos, 2 have a decorative icon instead — matches the real design exactly. */
export function SavoirFaireSection({ content }: { content: AProposContent['savoirFaire'] }) {
  return (
    <section className="bg-white px-6 py-24 md:px-12 lg:px-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="font-heading mb-4 text-4xl tracking-wide text-angaly-navy md:text-5xl">{content.title}</h2>
          <p className="mx-auto max-w-2xl font-light text-angaly-slate">{content.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {content.items.map((item) => {
            const Icon = item.icon ? ICONS[item.icon] : null;
            return (
              <div key={item.title} className="group text-center">
                <div className="relative mb-6 aspect-square overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    Icon && (
                      <div
                        className={
                          item.icon === 'cut'
                            ? 'bg-angaly-warm-ivory text-angaly-navy flex h-full w-full items-center justify-center'
                            : 'bg-angaly-navy text-angaly-champagne flex h-full w-full items-center justify-center'
                        }
                      >
                        <Icon className="h-14 w-14" strokeWidth={1} aria-hidden="true" />
                      </div>
                    )
                  )}
                </div>
                <h4 className="font-heading mb-2 text-2xl text-angaly-navy">{item.title}</h4>
                <p className="text-sm font-light text-angaly-slate">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
