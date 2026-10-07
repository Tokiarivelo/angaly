import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreationProjectStage } from '@angaly/types';

import {
  CREATION_PROJECT_REPOSITORY,
  ICreationProjectRepository,
} from '../../domain/repositories/creation-project.repository';
import { CreationProjectStageMedia } from '../../domain/entities/creation-project.entity';

export interface AddCreationProjectStageMediaInput {
  projectId: string;
  stage: CreationProjectStage;
  url: string;
  title?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  uploadedById?: string | null;
}

@Injectable()
export class AddCreationProjectStageMediaUseCase {
  constructor(
    @Inject(CREATION_PROJECT_REPOSITORY)
    private readonly repository: ICreationProjectRepository,
  ) {}

  async execute(input: AddCreationProjectStageMediaInput): Promise<CreationProjectStageMedia> {
    const project = await this.repository.findById(input.projectId);
    if (!project) {
      throw new NotFoundException(`Projet de création ${input.projectId} introuvable`);
    }

    return this.repository.addStageMedia(
      input.projectId,
      input.stage,
      {
        url: input.url,
        title: input.title,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      },
      input.uploadedById,
    );
  }
}
