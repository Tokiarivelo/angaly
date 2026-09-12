import { Inject, Injectable } from '@nestjs/common';
import {
  IPatternProjectRepository,
  PATTERN_PROJECT_REPOSITORY,
} from '../../domain/repositories/pattern-project.repository';
import { PatternProjectEntity } from '../../domain/entities/pattern-project.entity';
import { PatternStatus } from '../../domain/value-objects/pattern-status.vo';

export interface ListPatternProjectsOptions {
  status?: PatternStatus[];
  limit?: number;
}

@Injectable()
export class ListPatternProjectsUseCase {
  constructor(
    @Inject(PATTERN_PROJECT_REPOSITORY)
    private readonly projectRepository: IPatternProjectRepository,
  ) {}

  async execute(
    customerId: string,
    options?: ListPatternProjectsOptions,
  ): Promise<PatternProjectEntity[]> {
    return this.projectRepository.find({
      customerId,
      status: options?.status,
      limit: options?.limit,
    });
  }
}
