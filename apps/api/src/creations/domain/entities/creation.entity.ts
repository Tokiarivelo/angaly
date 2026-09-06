import type { CreationAvailability} from '../value-objects/availability.vo';
import { isCreationAvailability } from '../value-objects/availability.vo';

export interface CreationMediaSummary {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

export interface CreationCategorySummary {
  id: string;
  slug: string;
  name: string;
}

export interface CreationCollectionSummary {
  id: string;
  slug: string;
  name: string;
}

export interface CreationProps {
  id: string;
  slug: string;
  name: string;
  description: string;
  materials: string | null;
  techniques: string | null;
  availability: string;
  reproducible: boolean;
  isFeatured: boolean;
  featuredFrom: Date | null;
  featuredUntil: Date | null;
  category: CreationCategorySummary;
  collection: CreationCollectionSummary | null;
  media: CreationMediaSummary[];
  createdAt: Date;
  updatedAt: Date;
}

interface NormalizedCreationProps extends Omit<CreationProps, 'availability'> {
  availability: CreationAvailability;
}

/** Invariants: slug/name non-empty, availability is a recognized CreationAvailability. */
export class CreationEntity {
  private constructor(private readonly props: NormalizedCreationProps) {}

  static create(props: CreationProps): CreationEntity {
    if (props.slug.trim().length === 0) {
      throw new Error('Creation.slug must not be empty');
    }
    if (props.name.trim().length === 0) {
      throw new Error('Creation.name must not be empty');
    }
    if (!isCreationAvailability(props.availability)) {
      throw new Error(`Invalid CreationAvailability: ${props.availability}`);
    }
    return new CreationEntity({ ...props, availability: props.availability });
  }

  get id(): string {
    return this.props.id;
  }

  get slug(): string {
    return this.props.slug;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get materials(): string | null {
    return this.props.materials;
  }

  get techniques(): string | null {
    return this.props.techniques;
  }

  get availability(): CreationAvailability {
    return this.props.availability;
  }

  get reproducible(): boolean {
    return this.props.reproducible;
  }

  get isFeatured(): boolean {
    return this.props.isFeatured;
  }

  get featuredFrom(): Date | null {
    return this.props.featuredFrom;
  }

  get featuredUntil(): Date | null {
    return this.props.featuredUntil;
  }

  get category(): CreationCategorySummary {
    return this.props.category;
  }

  get collection(): CreationCollectionSummary | null {
    return this.props.collection;
  }

  get media(): CreationMediaSummary[] {
    return this.props.media;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
