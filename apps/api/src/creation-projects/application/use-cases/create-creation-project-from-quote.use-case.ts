import { Inject, Injectable } from '@nestjs/common';

import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import {
  CREATION_PROJECT_REPOSITORY,
  ICreationProjectRepository,
} from '../../domain/repositories/creation-project.repository';
import { generateCreationProjectReference } from '../../domain/value-objects/creation-project-reference.vo';

export interface CreationProjectQuoteSource {
  id: string;
  customerId: string;
  creationId: string | null;
  description: string;
}

const MAX_TITLE_LENGTH = 120;

/** Ouvre le projet « Mes créations » d'un devis accepté (idempotent : un seul projet par devis). */
@Injectable()
export class CreateCreationProjectFromQuoteUseCase {
  constructor(@Inject(CREATION_PROJECT_REPOSITORY) private readonly repository: ICreationProjectRepository) {}

  async execute(quote: CreationProjectQuoteSource): Promise<CreationProjectEntity> {
    const existing = await this.repository.findByQuoteId(quote.id);
    if (existing) {
      return existing;
    }
    const title = quote.description.trim().slice(0, MAX_TITLE_LENGTH) || 'Création sur mesure';
    return this.repository.create({
      reference: generateCreationProjectReference(),
      customerId: quote.customerId,
      title,
      description: quote.description.trim() === title ? null : quote.description,
      quoteId: quote.id,
      creationId: quote.creationId,
    });
  }
}
