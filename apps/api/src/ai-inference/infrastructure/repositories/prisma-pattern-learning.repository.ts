import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  IPatternLearningRepository,
  PatternLearningRecordData,
  PatternLearningRow,
} from '../../domain/repositories/pattern-learning.repository';

@Injectable()
export class PrismaPatternLearningRepository implements IPatternLearningRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertGenerated(data: PatternLearningRecordData): Promise<void> {
    const { patternProjectId, inspirationMediaId: _unused, ...snapshot } = data;
    await this.prisma.patternLearningRecord.upsert({
      where: { patternProjectId },
      // `outcome` is intentionally absent from `update` so an EXPORTED row stays EXPORTED.
      create: { patternProjectId, ...snapshot },
      update: snapshot,
    });
  }

  async markExported(patternProjectId: string): Promise<void> {
    await this.prisma.patternLearningRecord.updateMany({
      where: { patternProjectId },
      data: { outcome: 'EXPORTED' },
    });
  }

  async findRecentByGarmentType(garmentType: string, limit: number): Promise<PatternLearningRow[]> {
    const rows = await this.prisma.patternLearningRecord.findMany({
      where: { garmentType },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map((row) => ({
      cutType: row.cutType,
      occasion: row.occasion,
      style: row.style,
      details: row.details as Record<string, string>,
      outcome: row.outcome,
    }));
  }
}
