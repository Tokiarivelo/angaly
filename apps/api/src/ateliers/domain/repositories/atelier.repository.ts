import type { AtelierEntity } from '../entities/atelier.entity';

export const ATELIER_REPOSITORY = Symbol('IAtelierRepository');

export interface IAtelierRepository {
  findBySlug: (slug: string) => Promise<AtelierEntity | null>;
  /** No filters/pagination — low expected volume (see docs/features/ateliers.md). Sorted city then name. */
  list: () => Promise<AtelierEntity[]>;
}
