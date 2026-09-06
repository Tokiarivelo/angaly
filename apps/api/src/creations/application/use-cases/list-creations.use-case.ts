import { Inject, Injectable } from '@nestjs/common';

import {
  CREATION_REPOSITORY,
  CreationListFilter,
  CreationListResult,
  ICreationRepository,
} from '../../domain/repositories/creation.repository';

@Injectable()
export class ListCreationsUseCase {
  constructor(@Inject(CREATION_REPOSITORY) private readonly creationRepository: ICreationRepository) {}

  execute(filter: CreationListFilter): Promise<CreationListResult> {
    return this.creationRepository.list(filter);
  }
}
