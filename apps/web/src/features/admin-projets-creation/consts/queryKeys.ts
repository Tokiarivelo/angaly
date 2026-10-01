export const ADMIN_CREATION_PROJECTS_QUERY_KEYS = {
  all: ['admin-creation-projects'] as const,
  list: (stage?: string) => ['admin-creation-projects', 'list', stage ?? 'all'] as const,
};
