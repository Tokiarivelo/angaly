export interface MediaLibraryFilters {
  folderId: string;
  search: string;
  sortBy: 'recent' | 'name' | 'size';
  page: number;
}

export const mediaLibraryKey = (filters: MediaLibraryFilters) =>
  ['admin', 'media', 'list', filters] as const;

export const mediaDetailKey = (id: string) => ['admin', 'media', 'detail', id] as const;
