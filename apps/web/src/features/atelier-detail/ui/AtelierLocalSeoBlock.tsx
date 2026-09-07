import { Sparkles } from 'lucide-react';
import type { AtelierDto } from '@angaly/types';

/**
 * Real screen's local-context paragraph — editorial content, hardcoded per
 * docs/pages/atelier-detail.md "Points d'attention" (no dedicated Prisma field for a single
 * SEO paragraph), but templated with the real `city`/`name` rather than hardcoding
 * "Antananarivo" as if it held for every future atelier.
 */
/** French elision ("de " → "d'") before a city name starting with a vowel sound, e.g. "Antananarivo". */
function cityPreposition(city: string): string {
  return /^[aeiouyáéíóúàâäêëîïôöûü]/i.test(city) ? "d'" : 'de ';
}

export function AtelierLocalSeoBlock({ atelier }: { atelier: AtelierDto }) {
  return (
    <section className="bg-angaly-warm-ivory px-8 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <Sparkles className="mx-auto mb-6 h-8 w-8 text-angaly-champagne" strokeWidth={1} aria-hidden="true" />
        <p className="font-heading text-2xl leading-relaxed text-angaly-navy md:text-3xl">
          Situé au cœur vibrant {cityPreposition(atelier.city)}
          {atelier.city}, {atelier.name} est un pilier de l&apos;excellence ANGALY. C&apos;est ici que
          l&apos;héritage artisanal malgache rencontre la vision contemporaine de la haute couture, dans un espace
          dédié à la création, à la patience et à la beauté intemporelle.
        </p>
      </div>
    </section>
  );
}
