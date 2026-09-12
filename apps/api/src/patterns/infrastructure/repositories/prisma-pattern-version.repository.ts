import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreatePatternExportData,
  CreatePatternVersionData,
  IPatternVersionRepository,
} from '../../domain/repositories/pattern-version.repository';
import { PatternVersionEntity } from '../../domain/entities/pattern-version.entity';
import { PatternExportEntity } from '../../domain/entities/pattern-export.entity';
import { PatternVersionMapper } from '../mappers/pattern-version.mapper';

@Injectable()
export class PrismaPatternVersionRepository implements IPatternVersionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePatternVersionData): Promise<PatternVersionEntity> {
    const record = await this.prisma.patternVersion.create({
      data: {
        id: data.id,
        projectId: data.projectId,
        versionNumber: data.versionNumber,
        changeLabel: data.changeLabel ?? null,
        parametersJson: data.parametersJson as any,
        generatedByAI: data.generatedByAI ?? false,
        reviewedById: data.reviewedById ?? null,
        reviewNote: data.reviewNote ?? null,
        pieces: {
          create: data.pieces.map((piece) => ({
            name: piece.name,
            dimensionsJson: piece.dimensionsJson as any,
            fabricRecommendation: piece.fabricRecommendation ?? null,
            quantity: piece.quantity,
            grainlineJson: piece.grainlineJson ? (piece.grainlineJson as any) : undefined,
            seamAllowanceCm: piece.seamAllowanceCm ?? null,
            notchesJson: piece.notchesJson ? (piece.notchesJson as any) : undefined,
          })),
        },
      },
      include: {
        pieces: true,
        exports: {
          include: {
            media: true,
          },
        },
      },
    });

    return PatternVersionMapper.toEntity(record);
  }

  async findById(id: string): Promise<PatternVersionEntity | null> {
    const record = await this.prisma.patternVersion.findUnique({
      where: { id },
      include: {
        pieces: true,
        exports: {
          include: {
            media: true,
          },
        },
      },
    });

    return record ? PatternVersionMapper.toEntity(record) : null;
  }

  async findByProjectId(projectId: string): Promise<PatternVersionEntity[]> {
    const records = await this.prisma.patternVersion.findMany({
      where: { projectId },
      include: {
        pieces: true,
        exports: {
          include: {
            media: true,
          },
        },
      },
      orderBy: { versionNumber: 'desc' },
    });

    return records.map(PatternVersionMapper.toEntity);
  }

  async findLatestByProjectId(projectId: string): Promise<PatternVersionEntity | null> {
    const record = await this.prisma.patternVersion.findFirst({
      where: { projectId },
      include: {
        pieces: true,
        exports: {
          include: {
            media: true,
          },
        },
      },
      orderBy: { versionNumber: 'desc' },
    });

    return record ? PatternVersionMapper.toEntity(record) : null;
  }

  async createExport(data: CreatePatternExportData): Promise<PatternExportEntity> {
    const record = await this.prisma.patternExport.create({
      data: {
        id: data.id,
        versionId: data.versionId,
        format: data.format as any,
        mediaId: data.mediaId,
      },
      include: {
        media: true,
      },
    });

    return PatternVersionMapper.toExportEntity(record);
  }
}
