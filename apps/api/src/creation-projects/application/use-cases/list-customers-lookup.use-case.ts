import { Inject, Injectable } from '@nestjs/common';
import {
  CREATION_PROJECT_REPOSITORY,
  CustomerLookupItem,
  ICreationProjectRepository,
} from '../../domain/repositories/creation-project.repository';

@Injectable()
export class ListCustomersLookupUseCase {
  constructor(
    @Inject(CREATION_PROJECT_REPOSITORY)
    private readonly repository: ICreationProjectRepository,
  ) {}

  async execute(query?: string): Promise<CustomerLookupItem[]> {
    return this.repository.findCustomers(query);
  }
}
