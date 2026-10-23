import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { validatePatternExtParameters, type InspirationAnalysisSnapshot } from '@angaly/types';

import { CreatePatternProjectUseCase } from '../../../patterns/application/use-cases/create-pattern-project.use-case';
import {
  IPatternProjectRepository,
  PATTERN_PROJECT_REPOSITORY,
} from '../../../patterns/domain/repositories/pattern-project.repository';
import {
  CATALOG_IMAGE_REPOSITORY,
  PATTERN_CATALOG_SOURCE,
  type ICatalogImageRepository,
  type IPatternCatalogSource,
} from '../../domain/catalog-entry';

export interface CreateProjectFromCatalogInput {
  entryId: string;
  customerId: string;
  userId: string;
}

/**
 * Starts a pattern project from a catalogue dress: its cut, details and extended parameters (flounces, lining…), its
 * look for the 3D, and its inspiration photo (the catalogue's Media row).
 * The customer then generates it at their measurements like any project.
 */
@Injectable()
export class CreateProjectFromCatalogUseCase {
  constructor(
    @Inject(PATTERN_CATALOG_SOURCE) private readonly source: IPatternCatalogSource,
    @Inject(CATALOG_IMAGE_REPOSITORY) private readonly images: ICatalogImageRepository,
    private readonly createProject: CreatePatternProjectUseCase,
    @Inject(PATTERN_PROJECT_REPOSITORY) private readonly projects: IPatternProjectRepository,
  ) {}

  async execute(input: CreateProjectFromCatalogInput): Promise<{ projectId: string }> {
    const entry = this.source.find(input.entryId);
    if (!entry) throw new NotFoundException('Modèle introuvable dans le catalogue');
    const { template } = entry;

    const project = await this.createProject.execute(input.customerId, {
      garmentType: template.garmentType,
      cutType: template.cutType,
      detailsJson: template.details,
    });

    // The catalogue's own Media row: a stored file has a single row (bucket + key are unique), shared read-only.
    const image = (await this.images.findAll()).get(entry.id);

    const { value: ext } = validatePatternExtParameters(template.parametersExt);
    const analysis: InspirationAnalysisSnapshot = {
      features: { Modèle: entry.title, Époque: entry.era },
      profile: {
        isGarment: true,
        garmentType: template.garmentType,
        occasion: null,
        style: null,
        cutType: template.cutType,
        details: template.details,
        ...(template.look ? { fit: template.look } : {}),
      },
      modelVersion: 'catalogue',
    };
    await this.projects.update(project.id, {
      parametersExtJson: Object.keys(ext).length > 0 ? ext : null,
      inspirationAnalysisJson: analysis,
      ...(image ? { inspirationMediaId: image.mediaId } : {}),
    });
    return { projectId: project.id };
  }
}
