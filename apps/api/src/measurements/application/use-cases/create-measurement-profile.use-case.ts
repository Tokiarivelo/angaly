import { Inject, Injectable } from '@nestjs/common';
import { IMeasurementProfileRepository } from '../../domain/repositories/measurement-profile.repository';
import { CreateMeasurementProfileDto } from '../dtos/create-measurement-profile.dto';
import { MeasurementProfile } from '../../domain/entities/measurement-profile.entity';
import { MeasurementUnit } from '@angaly/types';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateMeasurementProfileUseCase {
  constructor(
    @Inject('IMeasurementProfileRepository')
    private readonly repository: IMeasurementProfileRepository,
  ) {}

  async execute(customerId: string, dto: CreateMeasurementProfileDto): Promise<MeasurementProfile> {
    const id = randomUUID();
    const unit = dto.unit || MeasurementUnit.CM;
    
    const valuesMap = new Map<string, number>();
    for (const [key, val] of Object.entries(dto.values)) {
      if (val > 0) {
        valuesMap.set(key, val);
      }
    }

    const profile = MeasurementProfile.create(
      id,
      customerId,
      dto.label,
      unit,
      valuesMap,
    );

    await this.repository.save(profile);
    return profile;
  }
}
