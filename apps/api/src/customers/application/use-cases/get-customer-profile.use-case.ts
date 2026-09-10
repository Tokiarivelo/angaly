import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CustomerEntity } from '../../domain/entities/customer.entity';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../domain/repositories/customer.repository';

@Injectable()
export class GetCustomerProfileUseCase {
  constructor(@Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository) {}

  async execute(userId: string): Promise<CustomerEntity> {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return customer;
  }
}
