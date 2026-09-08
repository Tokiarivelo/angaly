import type { CategoryKind } from '../value-objects/category-kind.vo';

export interface CategoryProps {
  id: string;
  slug: string;
  name: string;
  kind: CategoryKind;
}

/** Invariants: slug/name non-empty. */
export class CategoryEntity {
  private constructor(private readonly props: CategoryProps) {}

  static create(props: CategoryProps): CategoryEntity {
    if (props.slug.trim().length === 0) {
      throw new Error('Category.slug must not be empty');
    }
    if (props.name.trim().length === 0) {
      throw new Error('Category.name must not be empty');
    }
    return new CategoryEntity(props);
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

  get kind(): CategoryKind {
    return this.props.kind;
  }
}
