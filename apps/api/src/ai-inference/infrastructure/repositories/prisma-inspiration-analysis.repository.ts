import { Injectable } from '@nestjs/common';
import { Prisma } from '@angaly/database';
import type { GarmentProfile, InspirationAnalysisResponse } from '@angaly/types';
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
      profile: row.profile as GarmentProfile | null,
      suggestedCutType: row.suggestedCutType,
      confidence: row.confidence,
      modelVersion: row.modelVersion,
    };
  }

  async save(imageHash: string, analysis: InspirationAnalysisResponse): Promise<void> {
    const data = {
      features: analysis.features as Prisma.InputJsonValue,
      profile: analysis.profile
        ? (analysis.profile as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
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
