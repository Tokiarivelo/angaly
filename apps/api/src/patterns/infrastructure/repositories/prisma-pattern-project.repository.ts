import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreatePatternProjectData,
  FindProjectsFilter,
  IPatternProjectRepository,
} from '../../domain/repositories/pattern-project.repository';
import { PatternProjectEntity } from '../../domain/entities/pattern-project.entity';
import { PatternProjectMapper } from '../mappers/pattern-project.mapper';
import { PatternStatus } from '../../domain/value-objects/pattern-status.vo';

@Injectable()
export class PrismaPatternProjectRepository implements IPatternProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePatternProjectData): Promise<PatternProjectEntity> {
    const record = await this.prisma.patternProject.create({
      data: {
        id: data.id,
        projectRef: data.projectRef,
        customerId: data.customerId,
        garmentType: data.garmentType,
        occasion: data.occasion ?? null,
        style: data.style ?? null,
        cutType: data.cutType ?? null,
        detailsJson: data.detailsJson ? (data.detailsJson as any) : undefined,
        measurementProfileId: data.measurementProfileId ?? null,
        inspirationMediaId: data.inspirationMediaId ?? null,
        status: (data.status as any) ?? 'DRAFT',
      },
      include: {
        inspirationMedia: true,
        versions: {
          include: {
            pieces: true,
            exports: {
              include: {
                media: true,
              },
            },
          },
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    return PatternProjectMapper.toEntity(record);
  }

  async findById(id: string): Promise<PatternProjectEntity | null> {
    const record = await this.prisma.patternProject.findUnique({
      where: { id },
      include: {
        inspirationMedia: true,
        versions: {
          include: {
            pieces: true,
            exports: {
              include: {
                media: true,
              },
            },
          },
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    return record ? PatternProjectMapper.toEntity(record) : null;
  }

  async findByRef(projectRef: string): Promise<PatternProjectEntity | null> {
    const record = await this.prisma.patternProject.findUnique({
      where: { projectRef },
      include: {
        inspirationMedia: true,
        versions: {
          include: {
            pieces: true,
            exports: {
              include: {
                media: true,
              },
            },
          },
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    return record ? PatternProjectMapper.toEntity(record) : null;
  }

  async find(filter: FindProjectsFilter): Promise<PatternProjectEntity[]> {
    const where: any = {};
    if (filter.customerId) {
      where.customerId = filter.customerId;
    }
    if (filter.status && filter.status.length > 0) {
      where.status = { in: filter.status };
    }

    const records = await this.prisma.patternProject.findMany({
      where,
      take: filter.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        inspirationMedia: true,
        versions: {
          include: {
            pieces: true,
            exports: {
              include: {
                media: true,
              },
            },
          },
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    return records.map(PatternProjectMapper.toEntity);
  }

  async update(
    id: string,
    data: Partial<
      Omit<CreatePatternProjectData, 'id' | 'projectRef' | 'customerId'>
    > & { status?: PatternStatus },
  ): Promise<PatternProjectEntity> {
    const updateData: any = {};
    if (data.garmentType !== undefined) updateData.garmentType = data.garmentType;
    if (data.occasion !== undefined) updateData.occasion = data.occasion;
    if (data.style !== undefined) updateData.style = data.style;
    if (data.cutType !== undefined) updateData.cutType = data.cutType;
    if (data.detailsJson !== undefined) updateData.detailsJson = data.detailsJson;
    if (data.measurementProfileId !== undefined) updateData.measurementProfileId = data.measurementProfileId;
    if (data.inspirationMediaId !== undefined) updateData.inspirationMediaId = data.inspirationMediaId;
    if (data.status !== undefined) updateData.status = data.status;

    const record = await this.prisma.patternProject.update({
      where: { id },
      data: updateData,
      include: {
        inspirationMedia: true,
        versions: {
          include: {
            pieces: true,
            exports: {
              include: {
                media: true,
              },
            },
          },
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    return PatternProjectMapper.toEntity(record);
  }

  async count(): Promise<number> {
    return this.prisma.patternProject.count();
  }
}
