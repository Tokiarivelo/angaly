import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import {
  CREATION_PROJECT_REPOSITORY,
  ICreationProjectRepository,
} from '../../domain/repositories/creation-project.repository';

/** Back-office : assigne (ou désassigne, `userId = null`) un projet à un membre actif du staff. */
@Injectable()
export class AssignCreationProjectUseCase {
  constructor(@Inject(CREATION_PROJECT_REPOSITORY) private readonly repository: ICreationProjectRepository) {}

  async execute(id: string, userId: string | null): Promise<CreationProjectEntity> {
    const project = await this.repository.findById(id);
    if (!project) {
      throw new NotFoundException(`Creation project ${id} not found`);
    }
    if (userId !== null && !(await this.repository.findAssignableStaffById(userId))) {
      throw new BadRequestException('The assignee must be an active staff member');
    }
    if ((project.assignedTo?.id ?? null) === userId) {
      return project;
    }
    return this.repository.assign(id, userId);
  }
}
