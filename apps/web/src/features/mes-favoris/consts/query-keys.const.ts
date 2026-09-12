export const FAVORITES_QUERY_KEYS = {
  all: ['favorites'] as const,
  lists: () => [...FAVORITES_QUERY_KEYS.all, 'list'] as const,
  list: (type?: string) => [...FAVORITES_QUERY_KEYS.lists(), { type }] as const,
};
