import { Injectable } from '@nestjs/common';
import { CreationProjectStage, Role } from '@angaly/types';

import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreationProjectAssignee,
  CreationProjectEntity,
  CreationProjectStageMedia,
  CreationProjectStageNote,
} from '../../domain/entities/creation-project.entity';
import {
  CreateAdminCreationProjectData,
  CreateCreationProjectData,
  CustomerLookupItem,
  ICreationProjectRepository,
  QuoteLookupItem,
} from '../../domain/repositories/creation-project.repository';
import { generateCreationProjectReference } from '../../domain/value-objects/creation-project-reference.vo';
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

  async createAdminProject(data: CreateAdminCreationProjectData): Promise<CreationProjectEntity> {
    const stage = data.stage ?? CreationProjectStage.CONSULTATION;
    let customerId = data.customerId;

    if (!customerId && data.newCustomer) {
      const email = data.newCustomer.email.toLowerCase().trim();
      let user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email,
            passwordHash: '$2b$10$temporaryhashforadmincreatedclientplaceholder',
            role: Role.CLIENT,
            isActive: true,
          },
        });
      }
      let customer = await this.prisma.customer.findUnique({ where: { userId: user.id } });
      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            userId: user.id,
            firstName: data.newCustomer.firstName.trim(),
            lastName: data.newCustomer.lastName.trim(),
            phone: data.newCustomer.phone?.trim() ?? null,
          },
        });
      }
      customerId = customer.id;
    }

    if (!customerId) {
      throw new Error('Une cliente valide (existante ou nouvelle) est requise.');
    }

    const reference = generateCreationProjectReference();

    const row = await this.prisma.$transaction(async (tx) => {
      const project = await tx.creationProject.create({
        data: {
          reference,
          customerId,
          title: data.title.trim(),
          description: data.description?.trim() || null,
          stage,
          quoteId: data.quoteId ?? null,
          assignedToId: data.assignedToId ?? null,
        },
        include: WITH_RELATIONS,
      });

      await tx.creationProjectStageEvent.create({
        data: {
          projectId: project.id,
          fromStage: null,
          toStage: stage,
          changedById: data.creatorUserId ?? null,
        },
      });

      return project;
    });

    return CreationProjectMapper.toDomain(row);
  }

  async findCustomers(query?: string): Promise<CustomerLookupItem[]> {
    const q = query?.trim().toLowerCase();
    const rows = await this.prisma.customer.findMany({
      where: q
        ? {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { user: { email: { contains: q, mode: 'insensitive' } } },
              { phone: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        user: { select: { email: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: 50,
    });

    return rows.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.user.email,
      phone: r.phone,
    }));
  }

  async findQuotes(): Promise<QuoteLookupItem[]> {
    const rows = await this.prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
    });

    return rows.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      total: q.total.toString(),
      customerName: q.customer ? `${q.customer.firstName} ${q.customer.lastName}` : null,
    }));
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
        stageNotes: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { email: true } } },
        },
        stageMedia: {
          orderBy: { createdAt: 'desc' },
          include: { uploadedBy: { select: { email: true } } },
        },
      },
    });
    return row ? CreationProjectMapper.toDomain(row) : null;
  }

  async addStageNote(
    projectId: string,
    stage: CreationProjectStage,
    content: string,
    authorId?: string | null,
  ): Promise<CreationProjectStageNote> {
    const note = await this.prisma.creationProjectStageNote.create({
      data: {
        projectId,
        stage,
        content: content.trim(),
        authorId: authorId ?? null,
      },
      include: {
        author: { select: { email: true } },
      },
    });
    return {
      id: note.id,
      projectId: note.projectId,
      stage: note.stage as CreationProjectStage,
      content: note.content,
      authorEmail: note.author?.email ?? null,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }

  async deleteStageNote(projectId: string, noteId: string): Promise<void> {
    await this.prisma.creationProjectStageNote.deleteMany({
      where: { id: noteId, projectId },
    });
  }

  async addStageMedia(
    projectId: string,
    stage: CreationProjectStage,
    data: {
      url: string;
      title?: string | null;
      fileName?: string | null;
      mimeType?: string | null;
      sizeBytes?: number | null;
    },
    uploadedById?: string | null,
  ): Promise<CreationProjectStageMedia> {
    const media = await this.prisma.creationProjectStageMedia.create({
      data: {
        projectId,
        stage,
        url: data.url,
        title: data.title?.trim() || null,
        fileName: data.fileName?.trim() || null,
        mimeType: data.mimeType || null,
        sizeBytes: data.sizeBytes ?? null,
        uploadedById: uploadedById ?? null,
      },
      include: {
        uploadedBy: { select: { email: true } },
      },
    });
    return {
      id: media.id,
      projectId: media.projectId,
      stage: media.stage as CreationProjectStage,
      url: media.url,
      title: media.title,
      fileName: media.fileName,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      uploadedByEmail: media.uploadedBy?.email ?? null,
      createdAt: media.createdAt,
    };
  }

  async deleteStageMedia(projectId: string, mediaId: string): Promise<void> {
    await this.prisma.creationProjectStageMedia.deleteMany({
      where: { id: mediaId, projectId },
    });
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
