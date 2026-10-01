import { Inject, Injectable } from '@nestjs/common';

import { CreationProjectAssignee } from '../../domain/entities/creation-project.entity';
import {
  CREATION_PROJECT_REPOSITORY,
  ICreationProjectRepository,
} from '../../domain/repositories/creation-project.repository';

@Injectable()
export class ListAssignableStaffUseCase {
  constructor(@Inject(CREATION_PROJECT_REPOSITORY) private readonly repository: ICreationProjectRepository) {}

  execute(): Promise<CreationProjectAssignee[]> {
    return this.repository.findAssignableStaff();
  }
}
