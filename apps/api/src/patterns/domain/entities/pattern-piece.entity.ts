export interface PatternPieceProps {
  id: string;
  versionId: string;
  name: string;
  dimensionsJson: Record<string, unknown>;
  fabricRecommendation: string | null;
  quantity: number;
  grainlineJson: unknown | null;
  seamAllowanceCm: number | null;
  notchesJson: unknown | null;
}

export class PatternPieceEntity {
  private constructor(private readonly props: PatternPieceProps) {}

  static create(props: PatternPieceProps): PatternPieceEntity {
    return new PatternPieceEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get versionId(): string {
    return this.props.versionId;
  }

  get name(): string {
    return this.props.name;
  }

  get dimensionsJson(): Record<string, unknown> {
    return this.props.dimensionsJson;
  }

  get fabricRecommendation(): string | null {
    return this.props.fabricRecommendation;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get grainlineJson(): unknown | null {
    return this.props.grainlineJson;
  }

  get seamAllowanceCm(): number | null {
    return this.props.seamAllowanceCm;
  }

  get notchesJson(): unknown | null {
    return this.props.notchesJson;
  }
}
