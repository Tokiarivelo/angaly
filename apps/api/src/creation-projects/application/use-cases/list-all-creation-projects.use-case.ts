import { Inject, Injectable } from '@nestjs/common';
import type { CreationProjectStage } from '@angaly/types';

import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import {
  CREATION_PROJECT_REPOSITORY,
  ICreationProjectRepository,
} from '../../domain/repositories/creation-project.repository';

@Injectable()
export class ListAllCreationProjectsUseCase {
  constructor(@Inject(CREATION_PROJECT_REPOSITORY) private readonly repository: ICreationProjectRepository) {}

  execute(stage?: CreationProjectStage): Promise<CreationProjectEntity[]> {
    return this.repository.findAll(stage);
  }
}
