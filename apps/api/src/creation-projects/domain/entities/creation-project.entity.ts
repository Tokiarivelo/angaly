import { CREATION_PROJECT_STAGES_ORDER, CreationProjectStage } from '@angaly/types';

export interface CreationProjectProps {
  id: string;
  reference: string;
  customerId: string;
  title: string;
  description: string | null;
  stage: CreationProjectStage;
  quoteId: string | null;
  creationId: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Pipeline de spec §53 : Consultation → Conception → Patron → Confection → Essayage → Terminée. */
export class CreationProjectEntity {
  private constructor(private readonly props: CreationProjectProps) {}

  static create(props: CreationProjectProps): CreationProjectEntity {
    if (props.title.trim() === '') {
      throw new Error('CreationProject title cannot be empty');
    }
    return new CreationProjectEntity(props);
  }

  get id(): string { return this.props.id; }
  get reference(): string { return this.props.reference; }
  get customerId(): string { return this.props.customerId; }
  get title(): string { return this.props.title; }
  get description(): string | null { return this.props.description; }
  get stage(): CreationProjectStage { return this.props.stage; }
  get quoteId(): string | null { return this.props.quoteId; }
  get creationId(): string | null { return this.props.creationId; }
  get completedAt(): Date | null { return this.props.completedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  get isCompleted(): boolean {
    return this.props.stage === CreationProjectStage.TERMINEE;
  }

  /** Index (0-based) de l'étape courante dans le pipeline. */
  get stageIndex(): number {
    return CREATION_PROJECT_STAGES_ORDER.indexOf(this.props.stage);
  }
}
