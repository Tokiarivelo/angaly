import { Inject, Injectable } from '@nestjs/common';

import {
  COLLECTION_REPOSITORY,
  CollectionListFilter,
  CollectionListResult,
  ICollectionRepository,
} from '../../domain/repositories/collection.repository';

@Injectable()
export class ListCollectionsUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collectionRepository: ICollectionRepository,
  ) {}

  execute(filter: CollectionListFilter): Promise<CollectionListResult> {
    return this.collectionRepository.list(filter);
  }
}
