import type { PatternProjectEntity } from '../entities/pattern-project.entity';
import type { PatternStatus } from '../value-objects/pattern-status.vo';

export const PATTERN_PROJECT_REPOSITORY = Symbol('IPatternProjectRepository');

export interface CreatePatternProjectData {
  id: string;
  projectRef: string;
  customerId: string;
  garmentType: string;
  occasion?: string | null;
  style?: string | null;
  cutType?: string | null;
  detailsJson?: Record<string, unknown> | null;
  measurementProfileId?: string | null;
  inspirationMediaId?: string | null;
  status?: PatternStatus;
}

export interface FindProjectsFilter {
  customerId?: string;
  status?: PatternStatus[];
  limit?: number;
}

export interface IPatternProjectRepository {
  create(data: CreatePatternProjectData): Promise<PatternProjectEntity>;
  findById(id: string): Promise<PatternProjectEntity | null>;
  findByRef(projectRef: string): Promise<PatternProjectEntity | null>;
  find(filter: FindProjectsFilter): Promise<PatternProjectEntity[]>;
  update(
    id: string,
    data: Partial<
      Omit<CreatePatternProjectData, 'id' | 'projectRef' | 'customerId'>
    > & { status?: PatternStatus },
  ): Promise<PatternProjectEntity>;
  count(): Promise<number>;
}
