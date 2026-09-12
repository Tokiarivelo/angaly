import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IMeasurementProfileRepository } from '../../domain/repositories/measurement-profile.repository';
import { MeasurementProfile } from '../../domain/entities/measurement-profile.entity';

@Injectable()
export class GetMeasurementProfileUseCase {
  constructor(
    @Inject('IMeasurementProfileRepository')
    private readonly repository: IMeasurementProfileRepository,
  ) {}

  async execute(id: string, customerId?: string): Promise<MeasurementProfile> {
    const profile = await this.repository.findById(id);
    if (!profile) {
      throw new NotFoundException(`Measurement profile ${id} not found`);
    }
    if (customerId && profile.customerId !== customerId) {
      throw new ForbiddenException(`Access denied to profile ${id}`);
    }
    return profile;
  }
}
