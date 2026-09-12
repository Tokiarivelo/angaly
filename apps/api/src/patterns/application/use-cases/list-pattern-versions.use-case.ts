import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IPatternProjectRepository,
  PATTERN_PROJECT_REPOSITORY,
} from '../../domain/repositories/pattern-project.repository';
import {
  IPatternVersionRepository,
  PATTERN_VERSION_REPOSITORY,
} from '../../domain/repositories/pattern-version.repository';
import { PatternVersionEntity } from '../../domain/entities/pattern-version.entity';

@Injectable()
export class ListPatternVersionsUseCase {
  constructor(
    @Inject(PATTERN_PROJECT_REPOSITORY)
    private readonly projectRepository: IPatternProjectRepository,
    @Inject(PATTERN_VERSION_REPOSITORY)
    private readonly versionRepository: IPatternVersionRepository,
  ) {}

  async execute(projectId: string, customerId: string): Promise<PatternVersionEntity[]> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Projet de patron introuvable: ${projectId}`);
    }

    if (project.customerId !== customerId) {
      throw new ForbiddenException('Vous n’avez pas accès à ce projet de patron.');
    }

    return this.versionRepository.findByProjectId(projectId);
  }
}
