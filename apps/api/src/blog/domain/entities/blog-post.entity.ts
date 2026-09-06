export interface BlogPostMediaSummary {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

export interface BlogPostCategorySummary {
  id: string;
  slug: string;
  name: string;
}

/**
 * `User` is an identity/auth model, not an editorial profile — no display
 * name/bio/avatar exists yet (see docs/pages/journal-article.md).
 */
export interface BlogPostAuthorSummary {
  id: string;
  email: string;
}

export interface BlogPostProps {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** null for summary rows (list/related) — only get-blog-post-by-slug loads the full body. */
  content: string | null;
  publishedAt: Date | null;
  category: BlogPostCategorySummary;
  author: BlogPostAuthorSummary;
  media: BlogPostMediaSummary[];
  createdAt: Date;
  updatedAt: Date;
}

/** Invariants: slug/title non-empty; "published" is derived from publishedAt, never a stored flag. */
export class BlogPostEntity {
  private constructor(private readonly props: BlogPostProps) {}

  static create(props: BlogPostProps): BlogPostEntity {
    if (props.slug.trim().length === 0) {
      throw new Error('BlogPost.slug must not be empty');
    }
    if (props.title.trim().length === 0) {
      throw new Error('BlogPost.title must not be empty');
    }
    return new BlogPostEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get slug(): string {
    return this.props.slug;
  }

  get title(): string {
    return this.props.title;
  }

  get excerpt(): string {
    return this.props.excerpt;
  }

  get content(): string | null {
    return this.props.content;
  }

  get publishedAt(): Date | null {
    return this.props.publishedAt;
  }

  get isPublished(): boolean {
    return this.props.publishedAt !== null && this.props.publishedAt.getTime() <= Date.now();
  }

  get category(): BlogPostCategorySummary {
    return this.props.category;
  }

  get author(): BlogPostAuthorSummary {
    return this.props.author;
  }

  get media(): BlogPostMediaSummary[] {
    return this.props.media;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
