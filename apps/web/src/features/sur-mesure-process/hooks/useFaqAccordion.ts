import { useState } from 'react';

/** Single-open accordion: opening an item closes any other. */
export function useFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex((current) => (current === index ? null : index));
  }

  return { openIndex, toggle };
}
