import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreationProjectStage } from '@angaly/types';

import {
  CREATION_PROJECT_REPOSITORY,
  ICreationProjectRepository,
} from '../../domain/repositories/creation-project.repository';
import { CreationProjectStageNote } from '../../domain/entities/creation-project.entity';

export interface AddCreationProjectStageNoteInput {
  projectId: string;
  stage: CreationProjectStage;
  content: string;
  authorId?: string | null;
}

@Injectable()
export class AddCreationProjectStageNoteUseCase {
  constructor(
    @Inject(CREATION_PROJECT_REPOSITORY)
    private readonly repository: ICreationProjectRepository,
  ) {}

  async execute(input: AddCreationProjectStageNoteInput): Promise<CreationProjectStageNote> {
    const project = await this.repository.findById(input.projectId);
    if (!project) {
      throw new NotFoundException(`Projet de création ${input.projectId} introuvable`);
    }

    return this.repository.addStageNote(input.projectId, input.stage, input.content, input.authorId);
  }
}
