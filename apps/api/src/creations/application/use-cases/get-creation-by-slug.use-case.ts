import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CreationEntity } from '../../domain/entities/creation.entity';
import { CREATION_REPOSITORY, ICreationRepository } from '../../domain/repositories/creation.repository';

@Injectable()
export class GetCreationBySlugUseCase {
  constructor(@Inject(CREATION_REPOSITORY) private readonly creationRepository: ICreationRepository) {}

  async execute(slug: string): Promise<CreationEntity> {
    const creation = await this.creationRepository.findBySlug(slug);
    if (!creation) {
      throw new NotFoundException(`Creation with slug "${slug}" not found`);
    }
    return creation;
  }
}
