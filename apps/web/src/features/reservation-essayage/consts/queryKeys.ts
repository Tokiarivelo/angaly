export const QUERY_KEYS = {
  product: (productId: string) => ['reservation-essayage', 'product', productId] as const,
  ateliers: ['reservation-essayage', 'ateliers'] as const,
  monthAvailability: (atelierId: string, month: string) =>
    ['reservation-essayage', 'availability', atelierId, month] as const,
  daySlots: (atelierId: string, date: string) => ['reservation-essayage', 'availability', 'slots', atelierId, date] as const,
};
