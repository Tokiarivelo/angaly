import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  CREATION_PROJECT_REPOSITORY,
  ICreationProjectRepository,
} from '../../domain/repositories/creation-project.repository';

export interface DeleteCreationProjectStageMediaInput {
  projectId: string;
  mediaId: string;
}

@Injectable()
export class DeleteCreationProjectStageMediaUseCase {
  constructor(
    @Inject(CREATION_PROJECT_REPOSITORY)
    private readonly repository: ICreationProjectRepository,
  ) {}

  async execute(input: DeleteCreationProjectStageMediaInput): Promise<void> {
    const project = await this.repository.findById(input.projectId);
    if (!project) {
      throw new NotFoundException(`Projet de création ${input.projectId} introuvable`);
    }

    await this.repository.deleteStageMedia(input.projectId, input.mediaId);
  }
}
