'use client';

import { useState } from 'react';

/** Multi-select state for the grid's bulk-actions bar. */
export const useMediaSelection = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clear = () => setSelectedIds(new Set());

  return { selectedIds, toggle, clear, count: selectedIds.size };
};
