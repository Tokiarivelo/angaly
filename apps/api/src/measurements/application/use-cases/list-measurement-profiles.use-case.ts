import { Inject, Injectable } from '@nestjs/common';
import { IMeasurementProfileRepository } from '../../domain/repositories/measurement-profile.repository';
import { MeasurementProfile } from '../../domain/entities/measurement-profile.entity';

@Injectable()
export class ListMeasurementProfilesUseCase {
  constructor(
    @Inject('IMeasurementProfileRepository')
    private readonly repository: IMeasurementProfileRepository,
  ) {}

  async execute(customerId: string): Promise<MeasurementProfile[]> {
    return this.repository.findByCustomerId(customerId);
  }
}
