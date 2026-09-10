import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CustomerEntity } from '../../domain/entities/customer.entity';
import {
  CUSTOMER_REPOSITORY,
  ICustomerRepository,
  UpdateCustomerProfileInput,
} from '../../domain/repositories/customer.repository';

@Injectable()
export class UpdateCustomerProfileUseCase {
  constructor(@Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository) {}

  async execute(userId: string, changes: UpdateCustomerProfileInput): Promise<CustomerEntity> {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return this.customerRepository.update(customer.id, changes);
  }
}
