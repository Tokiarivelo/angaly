import { useCallback, useState } from 'react';

import { useTestimonialsQuery } from '../api/home.api';
import type { Testimonial } from '../types';

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
  const testimonials = query.data ?? [];
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
