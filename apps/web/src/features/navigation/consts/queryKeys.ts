export const QUERY_KEYS = {
  globalSearch: (query: string) => ['navigation', 'search', query] as const,
  content: ['navigation', 'content'] as const,
};
