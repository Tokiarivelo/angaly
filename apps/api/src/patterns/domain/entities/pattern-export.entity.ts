import type { PatternExportFormat } from '../value-objects/pattern-status.vo';

export interface PatternExportProps {
  id: string;
  versionId: string;
  format: PatternExportFormat;
  mediaId: string;
  mediaUrl?: string | null;
  createdAt: Date;
}

export class PatternExportEntity {
  private constructor(private readonly props: PatternExportProps) {}

  static create(props: PatternExportProps): PatternExportEntity {
    return new PatternExportEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get versionId(): string {
    return this.props.versionId;
  }

  get format(): PatternExportFormat {
    return this.props.format;
  }

  get mediaId(): string {
    return this.props.mediaId;
  }

  get mediaUrl(): string | null | undefined {
    return this.props.mediaUrl;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
