import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IMeasurementProfileRepository } from '../../domain/repositories/measurement-profile.repository';
import { MeasurementProfile } from '../../domain/entities/measurement-profile.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class DuplicateMeasurementProfileUseCase {
  constructor(
    @Inject('IMeasurementProfileRepository')
    private readonly repository: IMeasurementProfileRepository,
  ) {}

  async execute(id: string, customerId: string): Promise<MeasurementProfile> {
    const profile = await this.repository.findById(id);
    if (!profile) {
      throw new NotFoundException(`Measurement profile ${id} not found`);
    }
    if (profile.customerId !== customerId) {
      throw new ForbiddenException(`Access denied to profile ${id}`);
    }

    const newId = randomUUID();
    const newProfile = MeasurementProfile.create(
      newId,
      customerId,
      `${profile.label} (copie)`,
      profile.unit,
      new Map(profile.values),
    );

    await this.repository.save(newProfile);
    return newProfile;
  }
}
