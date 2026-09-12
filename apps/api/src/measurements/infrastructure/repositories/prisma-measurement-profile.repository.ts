import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IMeasurementProfileRepository } from '../../domain/repositories/measurement-profile.repository';
import { MeasurementProfile } from '../../domain/entities/measurement-profile.entity';
import { MeasurementProfileMapper } from '../mappers/measurement-profile.mapper';

@Injectable()
export class PrismaMeasurementProfileRepository implements IMeasurementProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<MeasurementProfile | null> {
    const entity = await this.prisma.measurementProfile.findUnique({
      where: { id },
      include: { values: true },
    });
    return entity ? MeasurementProfileMapper.toDomain(entity) : null;
  }

  async findByCustomerId(customerId: string): Promise<MeasurementProfile[]> {
    const entities = await this.prisma.measurementProfile.findMany({
      where: { customerId },
      include: { values: true },
      orderBy: { createdAt: 'desc' },
    });
    return entities.map(MeasurementProfileMapper.toDomain);
  }

  async save(profile: MeasurementProfile): Promise<void> {
    const valuesData = Array.from(profile.values.entries()).map(([key, valueCm]) => ({
      key,
      valueCm,
    }));

    await this.prisma.$transaction(async (tx: any) => {
      await tx.measurementProfile.upsert({
        where: { id: profile.id },
        create: {
          id: profile.id,
          customerId: profile.customerId,
          label: profile.label,
          unit: profile.unit,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        },
        update: {
          label: profile.label,
          unit: profile.unit,
          updatedAt: profile.updatedAt,
        },
      });

      // Simple implementation: delete all measurements for this profile and reinsert
      await tx.measurement.deleteMany({
        where: { profileId: profile.id },
      });

      if (valuesData.length > 0) {
        await tx.measurement.createMany({
          data: valuesData.map((val) => ({
            profileId: profile.id,
            key: val.key,
            valueCm: val.valueCm,
          })),
        });
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.measurementProfile.delete({
      where: { id },
    });
  }
}
