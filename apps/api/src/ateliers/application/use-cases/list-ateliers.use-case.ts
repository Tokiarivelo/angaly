import { Inject, Injectable } from '@nestjs/common';

import { AtelierEntity } from '../../domain/entities/atelier.entity';
import { ATELIER_REPOSITORY, IAtelierRepository } from '../../domain/repositories/atelier.repository';

@Injectable()
export class ListAteliersUseCase {
  constructor(@Inject(ATELIER_REPOSITORY) private readonly atelierRepository: IAtelierRepository) {}

  execute(): Promise<AtelierEntity[]> {
    return this.atelierRepository.list();
  }
}
