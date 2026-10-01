import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreationProjectStage } from '@angaly/types';

import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import {
  CREATION_PROJECT_REPOSITORY,
  ICreationProjectRepository,
} from '../../domain/repositories/creation-project.repository';

/** Back-office : fait avancer (ou corrige) l'étape ; `completedAt` suit l'étape TERMINEE. */
@Injectable()
export class UpdateCreationProjectStageUseCase {
  constructor(@Inject(CREATION_PROJECT_REPOSITORY) private readonly repository: ICreationProjectRepository) {}

  async execute(id: string, stage: CreationProjectStage): Promise<CreationProjectEntity> {
    const project = await this.repository.findById(id);
    if (!project) {
      throw new NotFoundException(`Creation project ${id} not found`);
    }
    if (project.stage === stage) {
      return project;
    }
    const completedAt = stage === CreationProjectStage.TERMINEE ? new Date() : null;
    return this.repository.updateStage(id, stage, completedAt);
  }
}
