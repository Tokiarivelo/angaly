import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { FavoriteEntity, FavoriteEntityType } from '../../domain/entities/favorite.entity';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../domain/repositories/customer.repository';
import { FAVORITE_REPOSITORY, IFavoriteRepository } from '../../domain/repositories/favorite.repository';

@Injectable()
export class AddFavoriteUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
    @Inject(FAVORITE_REPOSITORY) private readonly favoriteRepository: IFavoriteRepository,
  ) {}

  /** Idempotent: returns the existing row instead of erroring if the favorite already exists (docs/features/customers.md). */
  async execute(userId: string, entityType: FavoriteEntityType, entityId: string): Promise<FavoriteEntity> {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    const existing = await this.favoriteRepository.findByCustomerAndEntity(customer.id, entityType, entityId);
    if (existing) {
      return existing;
    }

    return this.favoriteRepository.create(customer.id, entityType, entityId);
  }
}
