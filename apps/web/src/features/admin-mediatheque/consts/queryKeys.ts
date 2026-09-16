export interface MediaLibraryFilters {
  folderId: string;
  search: string;
  sortBy: 'recent' | 'name' | 'size';
  page: number;
}

/**
 * Base key for every admin-mediatheque query. All mutation hooks
 * (`useDeleteMedia`/`useMediaUpload`/`useReplaceMedia`/`useUpdateMediaAlt`)
 * invalidate this single key rather than a mix of `['admin','media']`/
 * `['admin','media','list']` string literals — react-query prefix-matches,
 * so invalidating the base key covers both the list and every detail query.
 */
export const mediaBaseKey = ['admin', 'media'] as const;

export const mediaLibraryKey = (filters: MediaLibraryFilters) =>
  [...mediaBaseKey, 'list', filters] as const;

export const mediaDetailKey = (id: string) => [...mediaBaseKey, 'detail', id] as const;
