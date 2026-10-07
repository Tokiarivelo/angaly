import type { CreationProject as PrismaCreationProject } from '@angaly/database';
import type { CreationProjectStage, Role } from '@angaly/types';

import {
  CreationProjectDetailResponseDto,
  CreationProjectResponseDto,
} from '../../application/dtos/creation-project-response.dto';
import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';

export class CreationProjectMapper {
  static toDomain(
    row: PrismaCreationProject & {
      quote?: { quoteNumber: string } | null;
      customer?: { firstName: string; lastName: string } | null;
      assignedTo?: { id: string; email: string; role: string } | null;
      stageEvents?: Array<{
        id: string;
        fromStage: string | null;
        toStage: string;
        createdAt: Date;
        changedBy: { email: string } | null;
      }>;
      stageNotes?: Array<{
        id: string;
        projectId: string;
        stage: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        author?: { email: string } | null;
      }>;
      stageMedia?: Array<{
        id: string;
        projectId: string;
        stage: string;
        url: string;
        title?: string | null;
        fileName?: string | null;
        mimeType?: string | null;
        sizeBytes?: number | null;
        createdAt: Date;
        uploadedBy?: { email: string } | null;
      }>;
    },
  ): CreationProjectEntity {
    const customerName = row.customer
      ? `${row.customer.firstName} ${row.customer.lastName}`.trim()
      : null;

    return CreationProjectEntity.create({
      id: row.id,
      reference: row.reference,
      customerId: row.customerId,
      title: row.title,
      description: row.description,
      stage: row.stage as CreationProjectStage,
      quoteId: row.quoteId,
      quoteNumber: row.quote?.quoteNumber ?? null,
      customerName,
      creationId: row.creationId,
      completedAt: row.completedAt,
      assignedTo: row.assignedTo
        ? { id: row.assignedTo.id, email: row.assignedTo.email, role: row.assignedTo.role as Role }
        : null,
      stageHistory: row.stageEvents?.map((event) => ({
        id: event.id,
        fromStage: event.fromStage as CreationProjectStage | null,
        toStage: event.toStage as CreationProjectStage,
        changedByEmail: event.changedBy?.email ?? null,
        createdAt: event.createdAt,
      })),
      stageNotes: row.stageNotes?.map((note) => ({
        id: note.id,
        projectId: note.projectId,
        stage: note.stage as CreationProjectStage,
        content: note.content,
        authorEmail: note.author?.email ?? null,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })),
      stageMedia: row.stageMedia?.map((media) => ({
        id: media.id,
        projectId: media.projectId,
        stage: media.stage as CreationProjectStage,
        url: media.url,
        title: media.title ?? null,
        fileName: media.fileName ?? null,
        mimeType: media.mimeType ?? null,
        sizeBytes: media.sizeBytes ?? null,
        uploadedByEmail: media.uploadedBy?.email ?? null,
        createdAt: media.createdAt,
      })),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toResponse(entity: CreationProjectEntity): CreationProjectResponseDto {
    const dto = new CreationProjectResponseDto();
    dto.id = entity.id;
    dto.reference = entity.reference;
    dto.title = entity.title;
    dto.description = entity.description;
    dto.stage = entity.stage;
    dto.quoteId = entity.quoteId;
    dto.quoteNumber = entity.quoteNumber;
    dto.customerName = entity.customerName;
    dto.creationId = entity.creationId;
    dto.completedAt = entity.completedAt?.toISOString() ?? null;
    dto.assignedTo = entity.assignedTo;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }

  static toDetailResponse(entity: CreationProjectEntity): CreationProjectDetailResponseDto {
    const dto = Object.assign(new CreationProjectDetailResponseDto(), CreationProjectMapper.toResponse(entity));
    dto.stageHistory = entity.stageHistory.map((event) => ({
      id: event.id,
      fromStage: event.fromStage,
      toStage: event.toStage,
      changedByEmail: event.changedByEmail,
      createdAt: event.createdAt.toISOString(),
    }));
    dto.stageNotes = entity.stageNotes.map((note) => ({
      id: note.id,
      projectId: note.projectId,
      stage: note.stage,
      content: note.content,
      authorEmail: note.authorEmail,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    }));
    dto.stageMedia = entity.stageMedia.map((media) => ({
      id: media.id,
      projectId: media.projectId,
      stage: media.stage,
      url: media.url,
      title: media.title,
      fileName: media.fileName,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      uploadedByEmail: media.uploadedByEmail,
      createdAt: media.createdAt.toISOString(),
    }));
    return dto;
  }
}
