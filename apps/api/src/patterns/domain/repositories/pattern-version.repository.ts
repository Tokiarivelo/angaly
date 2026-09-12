import type { PatternExportEntity } from '../entities/pattern-export.entity';
import type { PatternPieceProps } from '../entities/pattern-piece.entity';
import type { PatternVersionEntity } from '../entities/pattern-version.entity';
import type { PatternExportFormat } from '../value-objects/pattern-status.vo';

export const PATTERN_VERSION_REPOSITORY = Symbol('IPatternVersionRepository');

export interface CreatePatternPieceData
  extends Omit<PatternPieceProps, 'id' | 'versionId'> {}

export interface CreatePatternVersionData {
  id: string;
  projectId: string;
  versionNumber: number;
  changeLabel?: string | null;
  parametersJson: Record<string, unknown>;
  generatedByAI?: boolean;
  reviewedById?: string | null;
  reviewNote?: string | null;
  pieces: CreatePatternPieceData[];
}

export interface CreatePatternExportData {
  id: string;
  versionId: string;
  format: PatternExportFormat;
  mediaId: string;
}

export interface IPatternVersionRepository {
  create(data: CreatePatternVersionData): Promise<PatternVersionEntity>;
  findById(id: string): Promise<PatternVersionEntity | null>;
  findByProjectId(projectId: string): Promise<PatternVersionEntity[]>;
  findLatestByProjectId(projectId: string): Promise<PatternVersionEntity | null>;
  createExport(data: CreatePatternExportData): Promise<PatternExportEntity>;
}
