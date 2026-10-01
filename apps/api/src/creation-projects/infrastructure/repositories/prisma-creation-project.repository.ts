import { Injectable } from '@nestjs/common';
import type { CreationProjectStage } from '@angaly/types';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import {
  CreateCreationProjectData,
  ICreationProjectRepository,
} from '../../domain/repositories/creation-project.repository';
import { CreationProjectMapper } from '../mappers/creation-project.mapper';

const WITH_RELATIONS = {
  quote: { select: { quoteNumber: true } },
  customer: { select: { firstName: true, lastName: true } },
} as const;

@Injectable()
export class PrismaCreationProjectRepository implements ICreationProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCustomerId(customerId: string): Promise<CreationProjectEntity[]> {
    const rows = await this.prisma.creationProject.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: WITH_RELATIONS,
    });
    return rows.map((row) => CreationProjectMapper.toDomain(row));
  }

  async findById(id: string): Promise<CreationProjectEntity | null> {
    const row = await this.prisma.creationProject.findUnique({ where: { id }, include: WITH_RELATIONS });
    return row ? CreationProjectMapper.toDomain(row) : null;
  }

  async findByQuoteId(quoteId: string): Promise<CreationProjectEntity | null> {
    const row = await this.prisma.creationProject.findFirst({ where: { quoteId }, include: WITH_RELATIONS });
    return row ? CreationProjectMapper.toDomain(row) : null;
  }

  async findAll(stage?: CreationProjectStage): Promise<CreationProjectEntity[]> {
    const rows = await this.prisma.creationProject.findMany({
      where: stage ? { stage } : undefined,
      orderBy: { createdAt: 'desc' },
      include: WITH_RELATIONS,
    });
    return rows.map((row) => CreationProjectMapper.toDomain(row));
  }

  async create(data: CreateCreationProjectData): Promise<CreationProjectEntity> {
    const row = await this.prisma.creationProject.create({ data, include: WITH_RELATIONS });
    return CreationProjectMapper.toDomain(row);
  }

  async updateStage(id: string, stage: CreationProjectStage, completedAt: Date | null): Promise<CreationProjectEntity> {
    const row = await this.prisma.creationProject.update({ where: { id }, data: { stage, completedAt }, include: WITH_RELATIONS });
    return CreationProjectMapper.toDomain(row);
  }
}
