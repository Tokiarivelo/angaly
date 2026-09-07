import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

import { useAteliersTeaser } from '../hooks/useAteliersTeaser';
import type { HomeContent } from '../hooks/useHomeContent';

/** stitch-prompts/01-home.md "SECTION 8 — NOS ATELIERS". Wired to real GET /api/ateliers. */
export function AteliersTeaser({ content }: { content: HomeContent['ateliersTeaser'] }) {
  const { data, isLoading } = useAteliersTeaser();

  if (isLoading || data.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <h2 className="font-heading text-4xl text-angaly-navy">{content.headline}</h2>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((atelier) => (
          <article key={atelier.id} className="bg-angaly-warm-ivory">
            <div className="relative aspect-[4/3] overflow-hidden">
              {atelier.media[0] ? (
                <Image
                  src={atelier.media[0].url}
                  alt={atelier.media[0].altText || atelier.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div aria-hidden="true" className="h-full w-full bg-gradient-to-br from-angaly-soft-navy to-angaly-navy" />
              )}
            </div>
            <div className="p-4">
              <p className="font-heading text-lg text-angaly-navy">{atelier.name}</p>
              <p className="mt-1 text-sm text-angaly-slate">
                {atelier.address}, {atelier.city}
              </p>
              <Button asChild variant="secondary" size="sm" className="mt-4">
                <Link href={ROUTES.ateliers}>Voir l&apos;itinéraire</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
