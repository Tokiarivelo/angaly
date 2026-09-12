import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  IPatternProjectRepository,
  PATTERN_PROJECT_REPOSITORY,
} from '../../domain/repositories/pattern-project.repository';
import { PatternProjectEntity } from '../../domain/entities/pattern-project.entity';
import { generatePatternProjectRef } from '../../domain/value-objects/pattern-project-ref.vo';
import { CreatePatternProjectDto } from '../dtos/create-pattern-project.dto';

@Injectable()
export class CreatePatternProjectUseCase {
  constructor(
    @Inject(PATTERN_PROJECT_REPOSITORY)
    private readonly projectRepository: IPatternProjectRepository,
  ) {}

  async execute(
    customerId: string,
    dto: CreatePatternProjectDto,
  ): Promise<PatternProjectEntity> {
    const id = randomUUID();
    const projectRef = generatePatternProjectRef();

    const project = await this.projectRepository.create({
      id,
      projectRef,
      customerId,
      garmentType: dto.garmentType,
      occasion: dto.occasion ?? null,
      style: dto.style ?? null,
      cutType: dto.cutType ?? null,
      detailsJson: dto.detailsJson ?? null,
      measurementProfileId: dto.measurementProfileId ?? null,
      status: 'DRAFT',
    });

    return project;
  }
}
