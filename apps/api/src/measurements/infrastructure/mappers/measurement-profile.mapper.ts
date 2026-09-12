import { MeasurementProfile } from '../../domain/entities/measurement-profile.entity';
import { MeasurementProfile as PrismaMeasurementProfile, Measurement as PrismaMeasurement } from '@angaly/database';
import { MeasurementUnit } from '@angaly/types';
import { MeasurementProfileDto } from '../../application/dtos/measurement-profile.dto';

type PrismaProfileWithValues = PrismaMeasurementProfile & { values: PrismaMeasurement[] };

export class MeasurementProfileMapper {
  static toDomain(prismaEntity: PrismaProfileWithValues): MeasurementProfile {
    const valuesMap = new Map<string, number>();
    for (const measurement of prismaEntity.values) {
      valuesMap.set(measurement.key, measurement.valueCm);
    }
    return MeasurementProfile.create(
      prismaEntity.id,
      prismaEntity.customerId,
      prismaEntity.label,
      prismaEntity.unit as MeasurementUnit,
      valuesMap,
      prismaEntity.createdAt,
      prismaEntity.updatedAt,
    );
  }

  static toDto(domainEntity: MeasurementProfile): MeasurementProfileDto {
    const valuesObj: Record<string, number> = {};
    for (const [key, val] of domainEntity.values.entries()) {
      valuesObj[key] = val;
    }
    return {
      id: domainEntity.id,
      customerId: domainEntity.customerId,
      label: domainEntity.label,
      unit: domainEntity.unit,
      values: valuesObj,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
    };
  }
}
