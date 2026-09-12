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
      {activeTestimonial &&
        (() => {
          const avatarUrl = activeTestimonial.avatarUrl ?? activeTestimonial.mediaUrl;
          const clientName = activeTestimonial.clientName ?? activeTestimonial.customerName ?? '';
          const isVerified = Boolean(
            activeTestimonial.verified ?? activeTestimonial.isVerified ?? false,
          );

          return (
            <figure className="text-center" aria-live="polite">
              {avatarUrl ? (
                <div className="border-angaly-champagne/40 relative mx-auto h-16 w-16 overflow-hidden rounded-full border-2 shadow-sm">
                  <Image
                    src={avatarUrl}
                    alt={clientName}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div
                  aria-hidden="true"
                  className="bg-angaly-champagne mx-auto h-16 w-16 rounded-full"
                />
              )}
              <blockquote className="font-heading text-angaly-navy mt-6 text-xl italic">
                « {activeTestimonial.quote} »
              </blockquote>
              <figcaption className="text-angaly-slate mt-4 text-sm">
                <span className="text-angaly-navy font-medium">{clientName}</span> —{' '}
                {activeTestimonial.creationLabel}
                {isVerified && (
                  <span className="bg-angaly-champagne/30 text-angaly-navy ml-2 rounded-sm px-2 py-0.5 text-xs">
                    Avis vérifié
                  </span>
                )}
              </figcaption>
            </figure>
          );
        })()}

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
