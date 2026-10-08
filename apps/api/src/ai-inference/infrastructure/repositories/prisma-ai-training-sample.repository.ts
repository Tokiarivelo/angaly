import { Injectable } from '@nestjs/common';
import type { Prisma } from '@angaly/database';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  AiTrainingSampleData,
  IAiTrainingSampleRepository,
} from '../../domain/repositories/ai-training-sample.repository';

@Injectable()
export class PrismaAiTrainingSampleRepository implements IAiTrainingSampleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveIfAbsent(data: AiTrainingSampleData): Promise<void> {
    const { task, inputHash } = data;
    await this.prisma.aiTrainingSample.upsert({
      where: { task_inputHash: { task, inputHash } },
      create: { ...data, output: data.output as Prisma.InputJsonValue },
      update: {},
    });
  }

  async confirmLabelByMediaId(task: string, mediaId: string, humanLabel: unknown): Promise<void> {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      select: { url: true },
    });
    if (!media) return;
    await this.prisma.aiTrainingSample.updateMany({
      where: { task, imageUrl: media.url, status: { not: 'EXCLUDED' } },
      data: { humanLabel: humanLabel as Prisma.InputJsonValue, status: 'HUMAN_CONFIRMED' },
    });
  }
}
