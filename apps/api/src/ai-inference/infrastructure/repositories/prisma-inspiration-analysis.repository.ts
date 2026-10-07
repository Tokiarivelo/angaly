import { Injectable } from '@nestjs/common';
import type { Prisma } from '@angaly/database';
import type { InspirationAnalysisResponse } from '@angaly/types';
import { PrismaService } from '../../../prisma/prisma.service';
import type { IInspirationAnalysisRepository } from '../../domain/repositories/inspiration-analysis.repository';

@Injectable()
export class PrismaInspirationAnalysisRepository implements IInspirationAnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByHash(imageHash: string): Promise<InspirationAnalysisResponse | null> {
    const row = await this.prisma.inspirationAnalysis.findUnique({ where: { imageHash } });
    if (!row) return null;
    return {
      features: row.features as Record<string, string>,
      suggestedCutType: row.suggestedCutType,
      confidence: row.confidence,
      modelVersion: row.modelVersion,
    };
  }

  async save(imageHash: string, analysis: InspirationAnalysisResponse): Promise<void> {
    const data = {
      features: analysis.features as Prisma.InputJsonValue,
      suggestedCutType: analysis.suggestedCutType,
      confidence: analysis.confidence,
      modelVersion: analysis.modelVersion,
    };
    await this.prisma.inspirationAnalysis.upsert({
      where: { imageHash },
      create: { imageHash, ...data },
      update: data,
    });
  }
}
