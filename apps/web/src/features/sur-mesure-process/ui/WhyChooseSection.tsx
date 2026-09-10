import { Gem, Heart, Scissors } from 'lucide-react';

import type { SurMesureContent } from '../hooks/useSurMesureContent';

const ICONS = { scissors: Scissors, gem: Gem, heart: Heart };

/** Three piliers — Précision, Exclusivité, Accompagnement — warm-ivory tint, antique-gold icons per the real screen. */
export function WhyChooseSection({ content }: { content: SurMesureContent['whyChoose'] }) {
  return (
    <section className="bg-angaly-warm-ivory/30 px-6 py-24 md:px-12 lg:px-24">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 text-center md:grid-cols-3">
        {content.items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <div key={item.title}>
              <Icon className="text-angaly-gold mx-auto mb-4 h-8 w-8" strokeWidth={1} aria-hidden="true" />
              <h3 className="font-heading mb-3 text-2xl text-angaly-navy">{item.title}</h3>
              <p className="text-sm leading-relaxed font-light text-angaly-slate">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
