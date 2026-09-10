import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../domain/repositories/customer.repository';
import { FAVORITE_REPOSITORY, IFavoriteRepository } from '../../domain/repositories/favorite.repository';

@Injectable()
export class RemoveFavoriteUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
    @Inject(FAVORITE_REPOSITORY) private readonly favoriteRepository: IFavoriteRepository,
  ) {}

  async execute(userId: string, favoriteId: string): Promise<void> {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    const favorite = await this.favoriteRepository.findById(favoriteId);
    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }
    // Never let a customer delete another customer's favorite via a guessed id.
    if (favorite.customerId !== customer.id) {
      throw new ForbiddenException('This favorite does not belong to the current customer');
    }

    await this.favoriteRepository.delete(favoriteId);
  }
}
