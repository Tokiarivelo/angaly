import type { PatternExportEntity } from './pattern-export.entity';
import type { PatternPieceEntity } from './pattern-piece.entity';

export interface PatternVersionProps {
  id: string;
  projectId: string;
  versionNumber: number;
  changeLabel: string | null;
  parametersJson: Record<string, unknown>;
  generatedByAI: boolean;
  reviewedById: string | null;
  reviewNote: string | null;
  createdAt: Date;
  pieces?: PatternPieceEntity[];
  exports?: PatternExportEntity[];
}

export class PatternVersionEntity {
  private constructor(private readonly props: PatternVersionProps) {}

  static create(props: PatternVersionProps): PatternVersionEntity {
    return new PatternVersionEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get projectId(): string {
    return this.props.projectId;
  }

  get versionNumber(): number {
    return this.props.versionNumber;
  }

  get changeLabel(): string | null {
    return this.props.changeLabel;
  }

  get parametersJson(): Record<string, unknown> {
    return this.props.parametersJson;
  }

  get generatedByAI(): boolean {
    return this.props.generatedByAI;
  }

  get reviewedById(): string | null {
    return this.props.reviewedById;
  }

  get reviewNote(): string | null {
    return this.props.reviewNote;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get pieces(): PatternPieceEntity[] | undefined {
    return this.props.pieces;
  }

  get exports(): PatternExportEntity[] | undefined {
    return this.props.exports;
  }
}
