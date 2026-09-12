import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IPatternProjectRepository,
  PATTERN_PROJECT_REPOSITORY,
} from '../../domain/repositories/pattern-project.repository';
import { PatternProjectEntity } from '../../domain/entities/pattern-project.entity';

@Injectable()
export class GetPatternProjectUseCase {
  constructor(
    @Inject(PATTERN_PROJECT_REPOSITORY)
    private readonly projectRepository: IPatternProjectRepository,
  ) {}

  async execute(projectId: string, customerId: string): Promise<PatternProjectEntity> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Projet de patron introuvable: ${projectId}`);
    }

    if (project.customerId !== customerId) {
      throw new ForbiddenException('Vous n’avez pas accès à ce projet de patron.');
    }

    return project;
  }
}
