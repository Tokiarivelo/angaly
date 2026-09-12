import type { PatternStatus } from '../value-objects/pattern-status.vo';
import type { PatternVersionEntity } from './pattern-version.entity';

export interface PatternProjectProps {
  id: string;
  projectRef: string;
  customerId: string;
  measurementProfileId: string | null;
  garmentType: string;
  occasion: string | null;
  style: string | null;
  cutType: string | null;
  detailsJson: Record<string, unknown> | null;
  inspirationMediaId: string | null;
  inspirationMediaUrl?: string | null;
  status: PatternStatus;
  createdAt: Date;
  updatedAt: Date;
  versions?: PatternVersionEntity[];
}

export class PatternProjectEntity {
  private constructor(private readonly props: PatternProjectProps) {}

  static create(props: PatternProjectProps): PatternProjectEntity {
    return new PatternProjectEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get projectRef(): string {
    return this.props.projectRef;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get measurementProfileId(): string | null {
    return this.props.measurementProfileId;
  }

  get garmentType(): string {
    return this.props.garmentType;
  }

  get occasion(): string | null {
    return this.props.occasion;
  }

  get style(): string | null {
    return this.props.style;
  }

  get cutType(): string | null {
    return this.props.cutType;
  }

  get detailsJson(): Record<string, unknown> | null {
    return this.props.detailsJson;
  }

  get inspirationMediaId(): string | null {
    return this.props.inspirationMediaId;
  }

  get inspirationMediaUrl(): string | null | undefined {
    return this.props.inspirationMediaUrl;
  }

  get status(): PatternStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get versions(): PatternVersionEntity[] | undefined {
    return this.props.versions;
  }

  get currentVersion(): PatternVersionEntity | null {
    if (!this.props.versions || this.props.versions.length === 0) {
      return null;
    }
    return this.props.versions[0] ?? null;
  }

  updateStep(
    changes: Partial<
      Pick<
        PatternProjectProps,
        | 'garmentType'
        | 'occasion'
        | 'style'
        | 'cutType'
        | 'detailsJson'
        | 'inspirationMediaId'
        | 'measurementProfileId'
      >
    >,
  ): void {
    Object.assign(this.props, changes);
    this.props.updatedAt = new Date();
  }

  changeStatus(status: PatternStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }
}
