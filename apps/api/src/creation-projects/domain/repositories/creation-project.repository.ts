import type { CreationProjectEntity } from '../entities/creation-project.entity';

export const CREATION_PROJECT_REPOSITORY = Symbol('ICreationProjectRepository');

export interface ICreationProjectRepository {
  findByCustomerId(customerId: string): Promise<CreationProjectEntity[]>;
  findById(id: string): Promise<CreationProjectEntity | null>;
}
