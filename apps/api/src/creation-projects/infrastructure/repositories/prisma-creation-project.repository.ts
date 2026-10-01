import { Injectable } from '@nestjs/common';
import { CreationProjectStage, Role } from '@angaly/types';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreationProjectAssignee, CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import {
  CreateCreationProjectData,
  ICreationProjectRepository,
} from '../../domain/repositories/creation-project.repository';
import { CreationProjectMapper } from '../mappers/creation-project.mapper';

const WITH_RELATIONS = {
  quote: { select: { quoteNumber: true } },
  customer: { select: { firstName: true, lastName: true } },
  assignedTo: { select: { id: true, email: true, role: true } },
} as const;

const STAFF_ROLES = [Role.COUTURIERE, Role.MANAGER, Role.ADMIN];

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

  async updateStage(
    id: string,
    stage: CreationProjectStage,
    completedAt: Date | null,
    changedById: string | null,
  ): Promise<CreationProjectEntity> {
    const row = await this.prisma.$transaction(async (tx) => {
      const current = await tx.creationProject.findUniqueOrThrow({ where: { id }, select: { stage: true } });
      await tx.creationProjectStageEvent.create({
        data: { projectId: id, fromStage: current.stage, toStage: stage, changedById },
      });
      return tx.creationProject.update({ where: { id }, data: { stage, completedAt }, include: WITH_RELATIONS });
    });
    return CreationProjectMapper.toDomain(row);
  }

  async findDetailById(id: string): Promise<CreationProjectEntity | null> {
    const row = await this.prisma.creationProject.findUnique({
      where: { id },
      include: {
        ...WITH_RELATIONS,
        stageEvents: {
          orderBy: { createdAt: 'desc' },
          include: { changedBy: { select: { email: true } } },
        },
      },
    });
    return row ? CreationProjectMapper.toDomain(row) : null;
  }

  async assign(id: string, userId: string | null): Promise<CreationProjectEntity> {
    const row = await this.prisma.creationProject.update({
      where: { id },
      data: { assignedToId: userId },
      include: WITH_RELATIONS,
    });
    return CreationProjectMapper.toDomain(row);
  }

  async findAssignableStaff(): Promise<CreationProjectAssignee[]> {
    const rows = await this.prisma.user.findMany({
      where: { isActive: true, role: { in: STAFF_ROLES } },
      orderBy: { email: 'asc' },
      select: { id: true, email: true, role: true },
    });
    return rows.map((row) => ({ id: row.id, email: row.email, role: row.role as Role }));
  }

  async findAssignableStaffById(userId: string): Promise<CreationProjectAssignee | null> {
    const row = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true, role: { in: STAFF_ROLES } },
      select: { id: true, email: true, role: true },
    });
    return row ? { id: row.id, email: row.email, role: row.role as Role } : null;
  }
}
