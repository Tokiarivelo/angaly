'use client';

import { useFeaturedCreations } from '../hooks/useFeaturedCreations';
import { useHomeContent } from '../hooks/useHomeContent';
import { AteliersTeaser } from './AteliersTeaser';
import { CategoriesSection } from './CategoriesSection';
import { HeroSection } from './HeroSection';
import { JournalTeaser } from './JournalTeaser';
import { LaUneSection } from './LaUneSection';
import { MaisonPresentationSection } from './MaisonPresentationSection';
import { NewsletterForm } from './NewsletterForm';
import { PatternStudioTeaser } from './PatternStudioTeaser';
import { SurMesureTeaser } from './SurMesureTeaser';
import { TestimonialsCarousel } from './TestimonialsCarousel';

/** Orchestrates stitch-prompts/01-home.md's sections — no logic here, see hooks/. */
export function HomePage() {
  const { data: content } = useHomeContent();
  const { data: featuredCreations } = useFeaturedCreations();

  return (
    <>
      <HeroSection content={content.hero} />
      <LaUneSection content={content.laUne} creations={featuredCreations} />
      <MaisonPresentationSection content={content.maison} />
      <CategoriesSection content={content.categories} />
      <SurMesureTeaser content={content.surMesure} />
      <PatternStudioTeaser content={content.patternStudio} />

      <section className="bg-angaly-ivory py-20">
        <h2 className="font-heading mb-12 text-center text-4xl text-angaly-navy">
          Elles nous ont fait confiance
        </h2>
        <TestimonialsCarousel />
      </section>

      <AteliersTeaser content={content.ateliersTeaser} />
      <JournalTeaser content={content.journalTeaser} />

      <section className="bg-angaly-navy py-20">
        <h2 className="font-heading mb-8 text-center text-3xl text-white">{content.newsletter.headline}</h2>
        <NewsletterForm />
      </section>
    </>
  );
}
