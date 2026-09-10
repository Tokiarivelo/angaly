import { Inject, Injectable } from '@nestjs/common';

import { FavoriteEntity, FavoriteEntityType } from '../../domain/entities/favorite.entity';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../domain/repositories/customer.repository';
import { FAVORITE_REPOSITORY, IFavoriteRepository } from '../../domain/repositories/favorite.repository';
import { CREATION_REPOSITORY, ICreationRepository } from '../../../creations/domain/repositories/creation.repository';
import { COLLECTION_REPOSITORY, ICollectionRepository } from '../../../collections/domain/repositories/collection.repository';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../products/domain/repositories/product.repository';

export interface FavoriteDisplay {
  name: string;
  slug: string;
  imageUrl: string | null;
}

export interface HydratedFavorite {
  favorite: FavoriteEntity;
  /** null when the referenced entity was deleted — see docs/features/customers.md "Points d'attention". */
  display: FavoriteDisplay | null;
}

const ENTITY_TYPE_ORDER: Record<FavoriteEntityType, number> = { CREATION: 0, PRODUCT: 1, COLLECTION: 2 };

@Injectable()
export class ListFavoritesUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
    @Inject(FAVORITE_REPOSITORY) private readonly favoriteRepository: IFavoriteRepository,
    @Inject(CREATION_REPOSITORY) private readonly creationRepository: ICreationRepository,
    @Inject(COLLECTION_REPOSITORY) private readonly collectionRepository: ICollectionRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
  ) {}

  async execute(userId: string): Promise<HydratedFavorite[]> {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) {
      return [];
    }

    const favorites = await this.favoriteRepository.listByCustomer(customer.id);
    const hydrated = await Promise.all(favorites.map((favorite) => this.hydrate(favorite)));

    return hydrated.sort((a, b) => {
      const orderDiff = ENTITY_TYPE_ORDER[a.favorite.entityType] - ENTITY_TYPE_ORDER[b.favorite.entityType];
      return orderDiff !== 0 ? orderDiff : b.favorite.createdAt.getTime() - a.favorite.createdAt.getTime();
    });
  }

  private async hydrate(favorite: FavoriteEntity): Promise<HydratedFavorite> {
    if (favorite.entityType === 'CREATION') {
      const creation = await this.creationRepository.findById(favorite.entityId);
      return {
        favorite,
        display: creation ? { name: creation.name, slug: creation.slug, imageUrl: creation.media[0]?.url ?? null } : null,
      };
    }

    if (favorite.entityType === 'COLLECTION') {
      const collection = await this.collectionRepository.findById(favorite.entityId);
      return {
        favorite,
        display: collection
          ? { name: collection.name, slug: collection.slug, imageUrl: collection.media[0]?.url ?? null }
          : null,
      };
    }

    const product = await this.productRepository.findById(favorite.entityId);
    return {
      favorite,
      display: product ? { name: product.name, slug: product.slug, imageUrl: product.media[0]?.url ?? null } : null,
    };
  }
}
