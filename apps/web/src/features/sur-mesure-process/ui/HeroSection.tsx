import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

import type { SurMesureContent } from '../hooks/useSurMesureContent';

/** Full-width cinematic hero, min-h-[90vh] per the real screen, navy gradient overlay at the bottom, two CTAs. */
export function HeroSection({ content }: { content: SurMesureContent['hero'] }) {
  return (
    <section className="relative flex min-h-[90vh] w-full items-end overflow-hidden">
      <div className="absolute inset-0 z-0 bg-angaly-navy">
        <Image src={content.imageUrl} alt="" fill priority sizes="100vw" className="object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-angaly-navy/90 via-angaly-navy/40 to-transparent" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-20 text-center text-white">
        <h1 className="font-heading mb-4 text-5xl tracking-wider md:text-7xl">{content.title}</h1>
        <p className="font-heading mx-auto mb-10 max-w-2xl text-xl text-angaly-champagne italic md:text-2xl">
          {content.subtitle}
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="w-full border-white bg-white text-angaly-navy hover:bg-angaly-warm-ivory sm:w-auto"
          >
            <Link href={ROUTES.demandeSurMesure}>Créer ma tenue sur mesure</Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="w-full border-white text-white hover:bg-white hover:text-angaly-navy sm:w-auto"
          >
            <Link href={ROUTES.prendreRendezVous}>Prendre rendez-vous</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
