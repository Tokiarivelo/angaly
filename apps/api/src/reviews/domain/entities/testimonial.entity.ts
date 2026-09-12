import { MediaEntity } from '../../../media/domain/entities/media.entity';

export class Testimonial {
  constructor(
    public readonly id: string,
    public readonly customerName: string,
    public readonly creationLabel: string | null,
    public readonly quote: string,
    public readonly isVerified: boolean,
    public readonly isPublished: boolean,
    public readonly createdAt: Date,
    public readonly media: MediaEntity[] = [],
  ) {
    if (!quote || quote.trim() === '') {
      throw new Error('Quote cannot be empty');
    }
  }
}
