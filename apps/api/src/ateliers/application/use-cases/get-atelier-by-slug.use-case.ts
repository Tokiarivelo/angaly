import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { AtelierEntity } from '../../domain/entities/atelier.entity';
import { ATELIER_REPOSITORY, IAtelierRepository } from '../../domain/repositories/atelier.repository';

@Injectable()
export class GetAtelierBySlugUseCase {
  constructor(@Inject(ATELIER_REPOSITORY) private readonly atelierRepository: IAtelierRepository) {}

  async execute(slug: string): Promise<AtelierEntity> {
    const atelier = await this.atelierRepository.findBySlug(slug);
    if (!atelier) {
      throw new NotFoundException(`Atelier with slug "${slug}" not found`);
    }
    return atelier;
  }
}
