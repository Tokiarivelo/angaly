import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { resolveCustomerId } from '../../../quotes/application/lib/resolve-customer-id';
import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import { CREATION_PROJECT_REPOSITORY, ICreationProjectRepository } from '../../domain/repositories/creation-project.repository';

@Injectable()
export class GetCreationProjectUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
    @Inject(CREATION_PROJECT_REPOSITORY) private readonly repository: ICreationProjectRepository,
  ) {}

  async execute(userId: string, id: string): Promise<CreationProjectEntity> {
    const customerId = await resolveCustomerId(this.customerRepository, userId);
    const project = await this.repository.findById(id);
    if (!project) {
      throw new NotFoundException(`Creation project ${id} not found`);
    }
    if (project.customerId !== customerId) {
      throw new ForbiddenException(`Access denied to creation project ${id}`);
    }
    return project;
  }
}
