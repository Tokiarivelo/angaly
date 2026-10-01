import type { CreationProjectStage } from '@angaly/types';

import type { CreationProjectEntity } from '../entities/creation-project.entity';

export const CREATION_PROJECT_REPOSITORY = Symbol('ICreationProjectRepository');

export interface CreateCreationProjectData {
  reference: string;
  customerId: string;
  title: string;
  description: string | null;
  quoteId: string | null;
  creationId: string | null;
}

export interface ICreationProjectRepository {
  findByCustomerId(customerId: string): Promise<CreationProjectEntity[]>;
  findById(id: string): Promise<CreationProjectEntity | null>;
  findByQuoteId(quoteId: string): Promise<CreationProjectEntity | null>;
  /** Back-office : tous les projets, filtrables par étape, plus récent d'abord. */
  findAll(stage?: CreationProjectStage): Promise<CreationProjectEntity[]>;
  create(data: CreateCreationProjectData): Promise<CreationProjectEntity>;
  updateStage(id: string, stage: CreationProjectStage, completedAt: Date | null): Promise<CreationProjectEntity>;
}
