export const ADMIN_CREATION_PROJECTS_QUERY_KEYS = {
  all: ['admin-creation-projects'] as const,
  list: (stage?: string) => ['admin-creation-projects', 'list', stage ?? 'all'] as const,
  detail: (id: string) => ['admin-creation-projects', 'detail', id] as const,
  assignees: ['admin-creation-projects', 'assignees'] as const,
  customers: (q?: string) => ['admin-creation-projects', 'customers', q ?? ''] as const,
  quotes: ['admin-creation-projects', 'quotes'] as const,
};
