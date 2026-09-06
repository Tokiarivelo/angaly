import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CollectionEntity } from '../../domain/entities/collection.entity';
import {
  COLLECTION_REPOSITORY,
  ICollectionRepository,
} from '../../domain/repositories/collection.repository';

@Injectable()
export class GetCollectionBySlugUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collectionRepository: ICollectionRepository,
  ) {}

  async execute(slug: string): Promise<CollectionEntity> {
    const collection = await this.collectionRepository.findPublishedBySlug(slug);
    if (!collection) {
      throw new NotFoundException(`Collection with slug "${slug}" not found`);
    }
    return collection;
  }
}
