import { Inject, Injectable } from '@nestjs/common';

import {
  CATALOG_IMAGE_REPOSITORY,
  PATTERN_CATALOG_SOURCE,
  type CatalogEntry,
  type ICatalogImageRepository,
  type IPatternCatalogSource,
} from '../../domain/catalog-entry';

export interface CatalogListItem extends Omit<CatalogEntry, 'template'> {
  garmentType: string;
  imageUrl: string | null;
}

/** The catalogue, each dress with its inspiration photo's URL when seeded (none: the page shows its sketch). */
@Injectable()
export class ListPatternCatalogUseCase {
  constructor(
    @Inject(PATTERN_CATALOG_SOURCE) private readonly source: IPatternCatalogSource,
    @Inject(CATALOG_IMAGE_REPOSITORY) private readonly images: ICatalogImageRepository,
  ) {}

  async execute(): Promise<CatalogListItem[]> {
    const images = await this.images.findAll();
    return this.source.list().map(({ template, ...entry }) => ({
      ...entry,
      garmentType: template.garmentType,
      imageUrl: images.get(entry.id)?.url ?? null,
    }));
  }
}
