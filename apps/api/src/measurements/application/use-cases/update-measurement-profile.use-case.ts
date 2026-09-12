import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IMeasurementProfileRepository } from '../../domain/repositories/measurement-profile.repository';
import { UpdateMeasurementProfileDto } from '../dtos/update-measurement-profile.dto';
import { MeasurementProfile } from '../../domain/entities/measurement-profile.entity';

@Injectable()
export class UpdateMeasurementProfileUseCase {
  constructor(
    @Inject('IMeasurementProfileRepository')
    private readonly repository: IMeasurementProfileRepository,
  ) {}

  async execute(id: string, customerId: string, dto: UpdateMeasurementProfileDto): Promise<MeasurementProfile> {
    const profile = await this.repository.findById(id);
    if (!profile) {
      throw new NotFoundException(`Measurement profile ${id} not found`);
    }
    if (profile.customerId !== customerId) {
      throw new ForbiddenException(`Access denied to profile ${id}`);
    }

    let valuesMap = profile.values;
    if (dto.values) {
      valuesMap = new Map<string, number>();
      for (const [key, val] of Object.entries(dto.values)) {
        if (val > 0) {
          valuesMap.set(key, val);
        }
      }
    }

    const updatedProfile = MeasurementProfile.create(
      profile.id,
      profile.customerId,
      dto.label || profile.label,
      dto.unit || profile.unit,
      valuesMap,
      profile.createdAt,
      new Date(),
    );

    await this.repository.save(updatedProfile);
    return updatedProfile;
  }
}
