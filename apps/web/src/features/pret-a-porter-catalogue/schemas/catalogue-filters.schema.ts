import { ProductAvailability } from '@angaly/types';
import { z } from 'zod';

/** Validates the catalogue's URL query params (see useCatalogueFilters.ts). All values arrive as strings from URLSearchParams. */
export const catalogueFiltersSchema = z.object({
  categoryId: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  status: z.nativeEnum(ProductAvailability).optional(),
  priceMin: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  priceMax: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  sort: z.enum(['newest', 'priceAsc', 'priceDesc']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
});

export type CatalogueFiltersValues = z.infer<typeof catalogueFiltersSchema>;
