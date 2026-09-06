import type { AtelierOpeningHours } from '../value-objects/opening-hours.vo';

export interface AtelierMediaSummary {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

export interface AtelierProps {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  openingHours: AtelierOpeningHours;
  services: string[];
  latitude: number | null;
  longitude: number | null;
  media: AtelierMediaSummary[];
  createdAt: Date;
  updatedAt: Date;
}

/** Invariants: slug/name non-empty, latitude/longitude both set or both null (never one alone). */
export class AtelierEntity {
  private constructor(private readonly props: AtelierProps) {}

  static create(props: AtelierProps): AtelierEntity {
    if (props.slug.trim().length === 0) {
      throw new Error('Atelier.slug must not be empty');
    }
    if (props.name.trim().length === 0) {
      throw new Error('Atelier.name must not be empty');
    }
    if ((props.latitude === null) !== (props.longitude === null)) {
      throw new Error('Atelier.latitude and Atelier.longitude must both be set or both be null');
    }
    return new AtelierEntity(props);
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

  get address(): string {
    return this.props.address;
  }

  get city(): string {
    return this.props.city;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get openingHours(): AtelierOpeningHours {
    return this.props.openingHours;
  }

  get services(): string[] {
    return this.props.services;
  }

  get latitude(): number | null {
    return this.props.latitude;
  }

  get longitude(): number | null {
    return this.props.longitude;
  }

  get hasCoordinates(): boolean {
    return this.props.latitude !== null && this.props.longitude !== null;
  }

  get media(): AtelierMediaSummary[] {
    return this.props.media;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
