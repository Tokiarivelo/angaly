import { useCallback, useState } from 'react';

import { useTestimonialsQuery } from '../api/home.api';
import type { Testimonial } from '../types';

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: 'testimonial-1',
    clientName: 'Nirina',
    creationLabel: 'Robe de mariée — Collection Éternelle',
    quote: 'Angaly a su donner vie à la robe dont je rêvais depuis toujours.',
    verified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80&fm=jpg',
  },
  {
    id: 'testimonial-2',
    clientName: 'Hery',
    creationLabel: 'Costume sur mesure',
    quote: 'Un savoir-faire rare et une écoute attentive à chaque étape.',
    verified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&fm=jpg',
  },
  {
    id: 'testimonial-3',
    clientName: 'Fara',
    creationLabel: 'Robe de soirée',
    quote: "Une élégance intemporelle, exactement ce que j'imaginais.",
    verified: false,
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80&fm=jpg',
  },
];

export function useTestimonials(): {
  data: Testimonial[];
  activeIndex: number;
  activeTestimonial: Testimonial | null;
  isLoading: boolean;
  error: Error | null;
  goToNext: () => void;
  goToPrevious: () => void;
  goToIndex: (index: number) => void;
} {
  const query = useTestimonialsQuery();
  const testimonials = query.data ?? (query.isError ? FALLBACK_TESTIMONIALS : []);
  const [activeIndex, setActiveIndex] = useState(0);

  const goToNext = useCallback(() => {
    setActiveIndex((current) => (testimonials.length === 0 ? 0 : (current + 1) % testimonials.length));
  }, [testimonials.length]);

  const goToPrevious = useCallback(() => {
    setActiveIndex((current) =>
      testimonials.length === 0 ? 0 : (current - 1 + testimonials.length) % testimonials.length,
    );
  }, [testimonials.length]);

  const goToIndex = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  return {
    data: testimonials,
    activeIndex,
    activeTestimonial: testimonials[activeIndex] ?? null,
    isLoading: query.isLoading,
    error: query.error,
    goToNext,
    goToPrevious,
    goToIndex,
  };
}
