import { Quote } from 'lucide-react';
import Image from 'next/image';

import type { SurMesureContent } from '../hooks/useSurMesureContent';

/** Single large testimonial on a deep-navy band: champagne quote mark, client photo, italic quote, name + role. */
export function TestimonialBlock({ content }: { content: SurMesureContent['testimonial'] }) {
  return (
    <section className="relative overflow-hidden bg-angaly-navy-blue px-6 py-24">
      <Quote
        aria-hidden="true"
        className="text-angaly-champagne/50 pointer-events-none absolute top-8 left-1/2 h-24 w-24 -translate-x-1/2"
        strokeWidth={1}
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="border-angaly-champagne relative mb-8 h-16 w-16 overflow-hidden rounded-full border">
          <Image src={content.imageUrl} alt="" fill sizes="64px" className="object-cover" />
        </div>
        <p className="font-heading mb-8 text-2xl leading-relaxed text-white italic md:text-3xl">
          &ldquo;{content.quote}&rdquo;
        </p>
        <p className="text-angaly-champagne text-sm tracking-wide">
          {content.name}
          <br />
          {content.role}
        </p>
      </div>
    </section>
  );
}
