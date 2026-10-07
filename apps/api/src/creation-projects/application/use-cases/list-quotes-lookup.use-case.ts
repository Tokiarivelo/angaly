import { Inject, Injectable } from '@nestjs/common';
import {
  CREATION_PROJECT_REPOSITORY,
  ICreationProjectRepository,
  QuoteLookupItem,
} from '../../domain/repositories/creation-project.repository';

@Injectable()
export class ListQuotesLookupUseCase {
  constructor(
    @Inject(CREATION_PROJECT_REPOSITORY)
    private readonly repository: ICreationProjectRepository,
  ) {}

  async execute(): Promise<QuoteLookupItem[]> {
    return this.repository.findQuotes();
  }
}
