import { apiClient } from '@/lib/api-client';
import type { PatternCatalogEntryDto } from '@angaly/types';

const unwrap = <T,>(res: T | { data: T }): T => (res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: T }).data : (res as T));

/** The dresses the pattern engine can make, with their inspiration photo. */
export const fetchPatternCatalog = async (): Promise<PatternCatalogEntryDto[]> =>
  unwrap(await apiClient.get<PatternCatalogEntryDto[] | { data: PatternCatalogEntryDto[] }>('/api/pattern-catalog'));

/** Starts a pattern project from a catalogue dress; returns the new project's id. */
export const createProjectFromCatalog = async (id: string): Promise<string> =>
  unwrap(await apiClient.post<{ projectId: string } | { data: { projectId: string } }>(`/api/pattern-catalog/${encodeURIComponent(id)}/projects`, {})).projectId;
