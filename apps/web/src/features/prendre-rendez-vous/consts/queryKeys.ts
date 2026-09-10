export const QUERY_KEYS = {
  ateliers: ['prendre-rendez-vous', 'ateliers'] as const,
  monthAvailability: (atelierId: string, month: string) =>
    ['prendre-rendez-vous', 'availability', atelierId, month] as const,
  daySlots: (atelierId: string, date: string) => ['prendre-rendez-vous', 'availability', 'slots', atelierId, date] as const,
};
