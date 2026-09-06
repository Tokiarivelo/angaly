import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { GroupedSearchResults, ISearchRepository, SEARCH_REPOSITORY } from '../../domain/repositories/search.repository';
import { normalizeSearchQuery } from '../../domain/value-objects/search-query.vo';

const DEFAULT_LIMIT_PER_TYPE = 5;

@Injectable()
export class GlobalSearchUseCase {
  constructor(@Inject(SEARCH_REPOSITORY) private readonly searchRepository: ISearchRepository) {}

  async execute(
    rawQuery: string,
    limitPerType: number = DEFAULT_LIMIT_PER_TYPE,
  ): Promise<GroupedSearchResults> {
    let query: string;
    try {
      query = normalizeSearchQuery(rawQuery);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid search query');
    }
    return this.searchRepository.search(query, limitPerType);
  }
}
