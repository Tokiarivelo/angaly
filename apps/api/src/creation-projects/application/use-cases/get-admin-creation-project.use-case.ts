import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import {
  CREATION_PROJECT_REPOSITORY,
  ICreationProjectRepository,
} from '../../domain/repositories/creation-project.repository';

/** Back-office : détail d'un projet (tous clients) avec l'historique des étapes. */
@Injectable()
export class GetAdminCreationProjectUseCase {
  constructor(@Inject(CREATION_PROJECT_REPOSITORY) private readonly repository: ICreationProjectRepository) {}

  async execute(id: string): Promise<CreationProjectEntity> {
    const project = await this.repository.findDetailById(id);
    if (!project) {
      throw new NotFoundException(`Creation project ${id} not found`);
    }
    return project;
  }
}
