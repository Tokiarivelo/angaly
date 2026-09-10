import Image from 'next/image';

import type { SurMesureContent } from '../hooks/useSurMesureContent';

/** Real screen: exactly 4 pieces, 2-column editorial grid with the 2nd/4th cards offset down (md:mt-24) on desktop, single column with no offset on mobile. */
export function RealisationsGallery({ content }: { content: SurMesureContent['gallery'] }) {
  return (
    <section className="bg-angaly-ivory px-6 py-24 md:px-12 lg:px-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-heading mb-16 text-center text-4xl tracking-wide text-angaly-navy md:text-5xl">
          {content.title}
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-8 md:gap-y-0">
          {content.items.map((item, index) => (
            <figure key={item.title} className={index % 2 === 1 ? 'md:mt-24' : undefined}>
              <div className="relative mb-4 aspect-[3/4] overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              <figcaption>
                <h4 className="font-heading text-lg text-angaly-navy">{item.title}</h4>
                <p className="text-xs tracking-wide text-angaly-slate uppercase">{item.label}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
