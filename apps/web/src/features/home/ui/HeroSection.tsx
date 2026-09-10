import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

import type { HomeContent } from '../hooks/useHomeContent';

/** stitch-prompts/01-home.md "SECTION 1 — HERO". Cinematic editorial photography. */
export function HeroSection({ content }: { content: HomeContent['hero'] }) {
  return (
    <section className="relative flex min-h-[90vh] items-end overflow-hidden bg-angaly-navy-dark">
      {content.imageUrl ? (
        <div className="absolute inset-0 z-0">
          <Image
            src={content.imageUrl}
            alt={content.imageAlt ?? content.headline}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-angaly-navy via-angaly-navy/40 to-transparent"
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-angaly-royal-navy via-angaly-soft-navy to-angaly-navy"
        />
      )}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-0 h-1/3 bg-gradient-to-t from-angaly-navy" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20">
        <p className="text-xs tracking-[0.3em] text-white/80 uppercase">{content.eyebrow}</p>
        <h1 className="font-heading mt-4 text-6xl text-white sm:text-8xl">{content.headline}</h1>
        <p className="font-heading mt-2 text-2xl text-angaly-champagne italic">{content.subheading}</p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="border-white bg-white text-angaly-navy hover:bg-angaly-warm-ivory"
          >
            <Link href={ROUTES.prendreRendezVous}>Prendre rendez-vous</Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="border-white text-white hover:bg-white hover:text-angaly-navy"
          >
            <Link href={ROUTES.creations}>Découvrir nos créations</Link>
          </Button>
        </div>
      </div>

      <ChevronDown
        aria-hidden="true"
        className="absolute bottom-6 left-1/2 z-10 h-6 w-6 -translate-x-1/2 animate-bounce text-white/70"
      />
    </section>
  );
}
