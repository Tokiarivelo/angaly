import type { MediaEntityRef } from '../value-objects/media-entity-ref.vo';

export interface MediaProps {
  id: string;
  bucket: string;
  objectKey: string;
  url: string;
  altText: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  entityRef: MediaEntityRef;
  sortOrder: number;
  uploadedById: string | null;
  createdAt: Date;
}

/** Invariants: bucket/objectKey non-empty, altText required (spec §74/§71 — accessibility/SEO). */
export class MediaEntity {
  private constructor(private readonly props: MediaProps) {}

  static create(props: MediaProps): MediaEntity {
    if (props.bucket.trim().length === 0) {
      throw new Error('Media.bucket must not be empty');
    }
    if (props.objectKey.trim().length === 0) {
      throw new Error('Media.objectKey must not be empty');
    }
    if (props.altText.trim().length === 0) {
      throw new Error('Media.altText is required');
    }
    if (props.sizeBytes < 0) {
      throw new Error('Media.sizeBytes must not be negative');
    }
    return new MediaEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get bucket(): string {
    return this.props.bucket;
  }

  get objectKey(): string {
    return this.props.objectKey;
  }

  get url(): string {
    return this.props.url;
  }

  get altText(): string {
    return this.props.altText;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get sizeBytes(): number {
    return this.props.sizeBytes;
  }

  get width(): number | null {
    return this.props.width;
  }

  get height(): number | null {
    return this.props.height;
  }

  get entityRef(): MediaEntityRef {
    return this.props.entityRef;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get uploadedById(): string | null {
    return this.props.uploadedById;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
