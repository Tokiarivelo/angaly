import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IPatternProjectRepository,
  PATTERN_PROJECT_REPOSITORY,
} from '../../domain/repositories/pattern-project.repository';
import { PatternProjectEntity } from '../../domain/entities/pattern-project.entity';
import { UpdatePatternProjectDto } from '../dtos/update-pattern-project.dto';

@Injectable()
export class UpdatePatternProjectStepUseCase {
  constructor(
    @Inject(PATTERN_PROJECT_REPOSITORY)
    private readonly projectRepository: IPatternProjectRepository,
  ) {}

  async execute(
    projectId: string,
    customerId: string,
    dto: UpdatePatternProjectDto,
  ): Promise<PatternProjectEntity> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Projet de patron introuvable: ${projectId}`);
    }

    if (project.customerId !== customerId) {
      throw new ForbiddenException('Vous n’avez pas accès à ce projet de patron.');
    }

    const updated = await this.projectRepository.update(projectId, {
      garmentType: dto.garmentType ?? project.garmentType,
      occasion: dto.occasion !== undefined ? dto.occasion : project.occasion,
      style: dto.style !== undefined ? dto.style : project.style,
      cutType: dto.cutType !== undefined ? dto.cutType : project.cutType,
      detailsJson: dto.detailsJson !== undefined ? dto.detailsJson : project.detailsJson,
      inspirationMediaId: dto.inspirationMediaId !== undefined ? dto.inspirationMediaId : project.inspirationMediaId,
      measurementProfileId: dto.measurementProfileId !== undefined ? dto.measurementProfileId : project.measurementProfileId,
    });

    return updated;
  }
}
