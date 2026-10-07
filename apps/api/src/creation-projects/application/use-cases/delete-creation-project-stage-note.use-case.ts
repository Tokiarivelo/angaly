import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  CREATION_PROJECT_REPOSITORY,
  ICreationProjectRepository,
} from '../../domain/repositories/creation-project.repository';

export interface DeleteCreationProjectStageNoteInput {
  projectId: string;
  noteId: string;
}

@Injectable()
export class DeleteCreationProjectStageNoteUseCase {
  constructor(
    @Inject(CREATION_PROJECT_REPOSITORY)
    private readonly repository: ICreationProjectRepository,
  ) {}

  async execute(input: DeleteCreationProjectStageNoteInput): Promise<void> {
    const project = await this.repository.findById(input.projectId);
    if (!project) {
      throw new NotFoundException(`Projet de création ${input.projectId} introuvable`);
    }

    await this.repository.deleteStageNote(input.projectId, input.noteId);
  }
}
