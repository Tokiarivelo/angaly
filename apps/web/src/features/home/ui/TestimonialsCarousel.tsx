'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

import { useTestimonials } from '../hooks/useTestimonials';

const SWIPE_THRESHOLD_PX = 40;

export function TestimonialsCarousel() {
  const { data, activeIndex, activeTestimonial, isLoading, goToNext, goToPrevious, goToIndex } =
    useTestimonials();
  const touchStartX = useRef<number | null>(null);

  if (isLoading || data.length === 0) {
    return null;
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    if (deltaX > SWIPE_THRESHOLD_PX) goToPrevious();
    else if (deltaX < -SWIPE_THRESHOLD_PX) goToNext();
    touchStartX.current = null;
  }

  return (
    <div
      className="relative mx-auto max-w-2xl px-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {activeTestimonial && (
        <figure className="text-center" aria-live="polite">
          {activeTestimonial.avatarUrl ? (
            <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-full border-2 border-angaly-champagne/40 shadow-sm">
              <Image
                src={activeTestimonial.avatarUrl}
                alt={activeTestimonial.clientName}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          ) : (
            <div aria-hidden="true" className="mx-auto h-16 w-16 rounded-full bg-angaly-champagne" />
          )}
          <blockquote className="font-heading mt-6 text-xl text-angaly-navy italic">
            « {activeTestimonial.quote} »
          </blockquote>
          <figcaption className="mt-4 text-sm text-angaly-slate">
            <span className="font-medium text-angaly-navy">{activeTestimonial.clientName}</span> —{' '}
            {activeTestimonial.creationLabel}
            {activeTestimonial.verified && (
              <span className="ml-2 rounded-sm bg-angaly-champagne/30 px-2 py-0.5 text-xs text-angaly-navy">
                Avis vérifié
              </span>
            )}
          </figcaption>
        </figure>
      )}

      <div className="mt-8 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={goToPrevious}
          aria-label="Témoignage précédent"
          className="text-angaly-navy hover:text-angaly-gold"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="flex gap-2" role="tablist" aria-label="Choisir un témoignage">
          {data.map((testimonial, index) => (
            <button
              key={testimonial.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Témoignage ${index + 1}`}
              onClick={() => goToIndex(index)}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                index === activeIndex ? 'bg-angaly-gold' : 'bg-angaly-border',
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goToNext}
          aria-label="Témoignage suivant"
          className="text-angaly-navy hover:text-angaly-gold"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
