'use client';

import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

import { useAtelierDetail } from '../hooks/useAtelierDetail';
import { AtelierAmbianceGallery } from './AtelierAmbianceGallery';
import { AtelierHeroGallery } from './AtelierHeroGallery';
import { AtelierInfoPanel } from './AtelierInfoPanel';
import { AtelierLocalSeoBlock } from './AtelierLocalSeoBlock';

/**
 * Orchestrates the real Stitch "Atelier Antananarivo Centre (Detail)" screen — JSX + hooks
 * only. No "Nos Artisans" team section: the real screen shows one, but there is no Prisma
 * model for a publishable team member (photo/role) — see docs/pages/atelier-detail.md
 * "Points d'attention", same omission pattern as a-propos's "Valeurs" section.
 */
export function AtelierDetailPage({ slug }: { slug: string }) {
  const { data: atelier, isLoading, error } = useAtelierDetail(slug);

  if (isLoading) {
    return null;
  }

  if (error || !atelier) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-angaly-slate">Cet atelier est introuvable.</p>
        <Link href={ROUTES.ateliers} className="mt-4 inline-block text-sm text-angaly-navy underline">
          Retour à nos ateliers
        </Link>
      </div>
    );
  }

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="mx-auto max-w-[1600px] px-8 py-6 text-xs tracking-widest text-angaly-slate uppercase">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href={ROUTES.home} className="hover:text-angaly-navy transition-colors">
              Accueil
            </Link>
          </li>
          <li className="flex items-center gap-2">
            <span>/</span>
            <Link href={ROUTES.ateliers} className="hover:text-angaly-navy transition-colors">
              Ateliers
            </Link>
          </li>
          <li aria-current="page" className="flex items-center gap-2 font-medium text-angaly-navy">
            <span>/</span>
            <span>{atelier.name}</span>
          </li>
        </ol>
      </nav>

      <div className="mx-auto max-w-[1600px]">
        <AtelierHeroGallery atelier={atelier} />
        <AtelierInfoPanel atelier={atelier} />
      </div>

      <AtelierAmbianceGallery atelier={atelier} />
      <AtelierLocalSeoBlock atelier={atelier} />
    </>
  );
}
