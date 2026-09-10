export const QUERY_KEYS = {
  appointment: (reference: string) => ['confirmation-rendez-vous', 'appointment', reference] as const,
  ateliers: ['confirmation-rendez-vous', 'ateliers'] as const,
};
